import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

type Props = {
  displayName: string;
  profilePhoto?: string | null;
  size?: number;
};

export default function UserAvatar({ displayName, profilePhoto, size = 36 }: Props) {
  const radius = size / 2;
  const fontSize = size * 0.44;

  if (profilePhoto) {
    return (
      <Image
        source={{ uri: profilePhoto }}
        style={{ width: size, height: size, borderRadius: radius }}
        resizeMode="cover"
      />
    );
  }

  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: radius }]}>
      <Text style={[styles.initial, { fontSize }]}>
        {displayName.charAt(0).toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    backgroundColor: '#FF8C00',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initial: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
