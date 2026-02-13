import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';

@Injectable()
export class UploadService {
  private s3Client: S3Client;
  private bucketName: string;

  constructor() {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
    this.bucketName = process.env.AWS_S3_BUCKET;
  }

  async uploadImage(file: Express.Multer.File): Promise<string> {
    const key = `gyms/${uuidv4()}-${file.originalname}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      // Remove ACL: 'public-read' - bucket doesn't support ACLs
    });

    await this.s3Client.send(command);

    return `https://${this.bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
  }

  async deleteImage(imageUrl: string): Promise<void> {
  try {
    // Extract the key from the S3 URL
    // URL format: https://bucket-name.s3.region.amazonaws.com/key
    const url = new URL(imageUrl);
    const key = url.pathname.substring(1); // Remove leading slash

    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    await this.s3Client.send(command);
    console.log(`✅ Deleted S3 object: ${key}`);
  } catch (error) {
    // Don't throw - if S3 delete fails, still delete from DB
    console.error('Failed to delete S3 object:', error);
  }
}
}