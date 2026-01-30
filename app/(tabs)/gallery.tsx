import { Typography } from '@/constants/Typography';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React, { useState } from 'react';
import { FlatList, Image, Modal, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Mock Data for Design Phase
const MOCK_IMAGES = Array.from({ length: 12 }).map((_, i) => ({
  id: `img-${i}`,
  uri: `https://picsum.photos/400/600?random=${i}`,
  prompt: `Futuristic cyberpunk city with neon lights #${i + 1}`,
  date: 'Today',
}));

export default function GalleryScreen() {
  const { colors, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const [selectedImage, setSelectedImage] = useState<typeof MOCK_IMAGES[0] | null>(null);

  // Responsive Grid Calculation
  const isDesktop = width > 768;
  const COLUMN_COUNT = isDesktop ? 5 : 2;
  const GAP = 16;
  const PADDING = 32; // Total horizontal padding (container + list)
  const availableWidth = width - PADDING - (GAP * (COLUMN_COUNT - 1));
  const ITEM_SIZE = availableWidth / COLUMN_COUNT;

  const renderItem = ({ item }: { item: typeof MOCK_IMAGES[0] }) => (
    <TouchableOpacity 
      activeOpacity={0.8}
      onPress={() => setSelectedImage(item)}
      style={[
        styles.imageContainer, 
        { 
          backgroundColor: colors.cardBackground,
          width: ITEM_SIZE,
          height: ITEM_SIZE * 1.5
        }
      ]}
    >
      <Image source={{ uri: item.uri }} style={styles.thumbnail} />
      <View style={styles.promptOverlay}>
        <Text style={styles.promptText} numberOfLines={2}>
          {item.prompt}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Gallery</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
          {MOCK_IMAGES.length} Creations
        </Text>
      </View>

      <FlatList
        key={COLUMN_COUNT} // Force re-render when columns change
        data={MOCK_IMAGES}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        numColumns={COLUMN_COUNT}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={[styles.columnWrapper, { gap: GAP }]}
        showsVerticalScrollIndicator={false}
      />

      {/* Full Screen Viewer Modal */}
      <Modal visible={!!selectedImage} transparent animationType="fade">
        <BlurView 
          intensity={95} 
          tint={isDark ? 'dark' : 'light'} 
          style={styles.modalContainer}
        >
           <TouchableOpacity 
            style={styles.closeButton} 
            onPress={() => setSelectedImage(null)}
          >
            <Ionicons name="close-circle" size={40} color={colors.text} />
          </TouchableOpacity>

          {selectedImage && (
            <View style={styles.modalContent}>
              <Image source={{ uri: selectedImage.uri }} style={styles.fullImage} />
              <View style={[styles.detailsCard, { backgroundColor: colors.cardBackground }]}>
                 <Text style={[styles.detailPrompt, { color: colors.text }]}>
                   {selectedImage.prompt}
                 </Text>
                 <Text style={[styles.detailDate, { color: colors.textSecondary }]}>
                   Generated {selectedImage.date}
                 </Text>
              </View>
            </View>
          )}
        </BlurView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    paddingTop: 8,
  },
  headerTitle: {
    ...Typography.header,
    fontSize: 34,
  },
  headerSubtitle: {
    ...Typography.body,
    fontSize: 14,
    marginTop: 4,
  },
  listContent: {
    padding: 16,
  },
  columnWrapper: {
    // justifyContent: 'space-between', // Removed in favor of gap
    marginBottom: 16,
  },
  imageContainer: {
    // Width and Height are now dynamic
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  promptOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  promptText: {
    color: '#FFFFFF',
    fontSize: 12,
    ...Typography.body,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 24,
    zIndex: 10,
  },
  modalContent: {
    width: '90%',
    maxWidth: 500, // Limit max width for desktop modal
    alignItems: 'center',
  },
  fullImage: {
    width: '100%', // Use relative width
    aspectRatio: 3/4, // Maintain aspect ratio
    borderRadius: 20,
    marginBottom: 24,
  },
  detailsCard: {
    width: '100%',
    padding: 20,
    borderRadius: 20,
  },
  detailPrompt: {
    ...Typography.bodySemiBold,
    fontSize: 16,
    marginBottom: 8,
  },
  detailDate: {
    ...Typography.caption,
  },
});
