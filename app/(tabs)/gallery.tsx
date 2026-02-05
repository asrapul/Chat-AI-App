import { Typography } from '@/constants/Typography';
import { useTheme } from '@/context/ThemeContext';
import { GeneratedImage, deleteMultipleGalleryImages, getGalleryImages } from '@/utils/storage';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Image, Modal, Platform, RefreshControl, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function GalleryScreen() {
  const { colors, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const [isLoading, setIsLoading] = useState(true);
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Load images from AsyncStorage
  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    setIsLoading(true);
    const saved = await getGalleryImages();
    setImages(saved);
    setIsLoading(false);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadImages();
    setRefreshing(false);
  }, []);

  const toggleSelectionMode = () => {
    if (isSelectionMode) {
      setSelectedIds(new Set());
    }
    setIsSelectionMode(!isSelectionMode);
  };

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    
    const count = selectedIds.size;
    const performDelete = async () => {
      await deleteMultipleGalleryImages(Array.from(selectedIds));
      setSelectedIds(new Set());
      setIsSelectionMode(false);
      await loadImages();
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Are you sure you want to delete ${count} images?`)) {
        performDelete();
      }
    } else {
      Alert.alert(
        'Delete Images',
        `Are you sure you want to delete ${count} images?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: performDelete }
        ]
      );
    }
  };

  // Responsive Grid Calculation
  const isDesktop = width > 768;
  const COLUMN_COUNT = isDesktop ? 5 : 2;
  const GAP = 16;
  const PADDING = 32; // Total horizontal padding (container + list)
  const availableWidth = width - PADDING - (GAP * (COLUMN_COUNT - 1));
  const ITEM_SIZE = availableWidth / COLUMN_COUNT;

  const renderItem = ({ item }: { item: GeneratedImage }) => {
    const isSelected = selectedIds.has(item.id);
    
    return (
      <TouchableOpacity 
        activeOpacity={0.8}
        onPress={() => isSelectionMode ? toggleSelection(item.id) : setSelectedImage(item)}
        style={[
          styles.imageContainer, 
          { 
            backgroundColor: colors.cardBackground,
            width: ITEM_SIZE,
            height: ITEM_SIZE * 1.5,
            borderWidth: isSelectionMode && isSelected ? 3 : 0,
            borderColor: colors.primary
          }
        ]}
      >
        <Image source={{ uri: item.uri }} style={styles.thumbnail} />
        
        {isSelectionMode && (
          <View style={styles.selectionOverlay}>
             <Ionicons 
                name={isSelected ? "checkmark-circle" : "ellipse-outline"} 
                size={24} 
                color={isSelected ? colors.primary : "#FFFFFF"} 
              />
          </View>
        )}

        {!isSelectionMode && (
          <View style={styles.promptOverlay}>
            <Text style={styles.promptText} numberOfLines={2}>
              {item.prompt}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Gallery</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              {images.length} Creations
            </Text>
          </View>
          <TouchableOpacity 
            onPress={toggleSelectionMode} 
            style={[styles.selectButton, { backgroundColor: isSelectionMode ? colors.primary : 'rgba(0,0,0,0.05)' }]}
          >
            <Text style={[styles.selectButtonText, { color: isSelectionMode ? '#FFFFFF' : colors.primary }]}>
              {isSelectionMode ? 'Cancel' : 'Select'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {images.length === 0 && !isLoading ? (
        <View style={styles.emptyState}>
          <Ionicons name="image-outline" size={80} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No images yet
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.textLight }]}>
            Generate images using Image Generator to see them here
          </Text>
        </View>
      ) : (
        <FlatList
          key={COLUMN_COUNT} // Force re-render when columns change
          data={images}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          numColumns={COLUMN_COUNT}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={[styles.columnWrapper, { gap: GAP }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
        />
      )}

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
                   Generated {new Date(selectedImage.timestamp).toLocaleDateString()}
                 </Text>
              </View>
            </View>
          )}
        </BlurView>
      </Modal>

      {isSelectionMode && (
        <View style={[styles.bulkActionBar, { backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF', borderTopColor: colors.border }]}>
          <TouchableOpacity onPress={handleBulkDelete} disabled={selectedIds.size === 0} style={styles.bulkActionItem}>
            <Ionicons name="trash-outline" size={24} color={selectedIds.size > 0 ? colors.error : colors.textSecondary} />
            <Text style={[styles.bulkActionText, { color: selectedIds.size > 0 ? colors.error : colors.textSecondary }]}>Delete selected</Text>
          </TouchableOpacity>
          <View style={styles.selectionCountContainer}>
            <Text style={[styles.selectionCount, { color: colors.text }]}>{selectedIds.size} Selected</Text>
          </View>
        </View>
      )}
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  selectButtonText: {
    ...Typography.bodySemiBold,
    fontSize: 14,
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
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    ...Typography.bodySemiBold,
    fontSize: 20,
    marginTop: 24,
    marginBottom: 8,
  },
  emptySubtext: {
    ...Typography.body,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  selectionOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    padding: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...Typography.body,
    marginTop: 12,
  },
  bulkActionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 90,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    paddingBottom: 25,
    borderTopWidth: 1,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  bulkActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bulkActionText: {
    ...Typography.bodySemiBold,
    fontSize: 15,
  },
  selectionCountContainer: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  selectionCount: {
    ...Typography.bodySemiBold,
    fontSize: 14,
  },
});
