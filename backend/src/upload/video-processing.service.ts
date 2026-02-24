import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import * as ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import ffmpeg from 'fluent-ffmpeg';  // Changed this line
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class VideoProcessingService {
  private s3Client: S3Client;
  private bucketName: string;

  constructor() {
    // Set ffmpeg path
    ffmpeg.setFfmpegPath(ffmpegInstaller.path);

    this.s3Client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
    this.bucketName = process.env.AWS_S3_BUCKET;
  }

  async generateThumbnail(videoPath: string): Promise<string> {
    const thumbnailFilename = `thumbnail-${uuidv4()}.jpg`;
    const thumbnailPath = path.join('/tmp', thumbnailFilename);

    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .screenshots({
          timestamps: ['00:00:00'],
          filename: thumbnailFilename,
          folder: '/tmp',
          size: '640x?',
        })
        .on('end', () => {
          resolve(thumbnailPath);
        })
        .on('error', (err) => {
          reject(err);
        });
    });
  }

  async uploadToS3(filePath: string, key: string, contentType: string): Promise<string> {
    const fileContent = fs.readFileSync(filePath);

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: fileContent,
      ContentType: contentType,
    });

    await this.s3Client.send(command);

    return `https://${this.bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
  }

  async processAndUploadVideo(
    videoFile: Express.Multer.File,
  ): Promise<{ videoUrl: string; thumbnailUrl: string }> {
    const videoFilename = `videos/${uuidv4()}-${videoFile.originalname}`;
    const tempVideoPath = path.join('/tmp', `video-${uuidv4()}.mp4`);

    // Write video to temp file
    fs.writeFileSync(tempVideoPath, videoFile.buffer);

    try {
      // Generate thumbnail
      const thumbnailPath = await this.generateThumbnail(tempVideoPath);
      const thumbnailFilename = `thumbnails/${uuidv4()}.jpg`;

      // Upload video
      const videoUrl = await this.uploadToS3(
        tempVideoPath,
        videoFilename,
        videoFile.mimetype,
      );

      // Upload thumbnail
      const thumbnailUrl = await this.uploadToS3(
        thumbnailPath,
        thumbnailFilename,
        'image/jpeg',
      );

      // Cleanup temp files
      fs.unlinkSync(tempVideoPath);
      fs.unlinkSync(thumbnailPath);

      return { videoUrl, thumbnailUrl };
    } catch (error) {
      // Cleanup temp files on error
      if (fs.existsSync(tempVideoPath)) {
        fs.unlinkSync(tempVideoPath);
      }
      throw error;
    }
  }
}