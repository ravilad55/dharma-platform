import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { addCartItem, Cart, getCart, removeCartItem, updateCartItem } from "../../src/api/cart";
import { getCategories, getProducts, Product } from "../../src/api/catalog";
import { getErrorMessage } from "../../src/api/errors";
import { borderRadius, colors, DharmaSearchBar, shadows, spacing } from "../../src/design-system";
import { getLocalProductImage } from "../../src/features/samagri/productImages";

const CART_BAR_HEIGHT = 74;
const categoryLabels = ["Kits", "Diyas", "Flowers", "Incense", "More"];

function ProductImage({ imageReference }: { imageReference?: string | null }) {
  const LocalImage = getLocalProductImage(imageReference);
  if (LocalImage) return <LocalImage width="100%" height="100%" preserveAspectRatio="xMidYMid slice" />;
  if (imageReference) return <Image source={{ uri: imageReference }} style={styles.image} resizeMode="cover" />;
  return <View style={styles.imagePlaceholder}><Text style={styles.imagePlaceholderText}>Dharma</Text><Text style={styles.imagePlaceholderSubtext}>Pooja Samagri</Text></View>;
}

function ProductCard({ product, index, quantity, onAdd, onChangeQuantity, disabled }: { product: Product; index: number; quantity: number; onAdd: () => void; onChangeQuantity: (change: number) => void; disabled: boolean }) {
  return (
    <View style={styles.card}>
      <View style={styles.imageFrame}>
        <ProductImage imageReference={product.imageUrl} />
        {index === 0 ? <View style={styles.bestseller}><Text style={styles.bestsellerText}>Bestseller</Text></View> : null}
      </View>
      <View style={styles.productInfo}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel={`Favorite ${product.name}`} hitSlop={8} style={styles.favorite}>
            <Text style={styles.favoriteIcon}>♡</Text>
          </Pressable>
        </View>
        <Text style={styles.description} numberOfLines={2}>{product.shortDescription || "Pooja essentials for your sacred rituals."}</Text>
        <View style={styles.productBottomRow}>
          <View style={styles.priceStock}>
            <Text style={styles.price}>{product.currency === "INR" ? "\u20B9" : `${product.currency} `}{product.price}</Text>
            {product.isAvailable ? <Text style={styles.stock}>In Stock</Text> : <Text style={styles.unavailable}>Out of Stock</Text>}
          </View>
          {quantity === 0 ? <Pressable accessibilityRole="button" accessibilityLabel={`Add ${product.name} to cart`} onPress={onAdd} disabled={disabled} style={styles.addButton}><Text style={styles.addButtonText}>Add to Cart</Text></Pressable> : <View style={styles.stepper}>
            <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${product.name}`} onPress={() => onChangeQuantity(-1)} disabled={disabled} style={styles.stepperAction}><Text style={styles.stepperButton}>-</Text></Pressable>
            <Text style={styles.quantity}>{quantity}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel={`Add ${product.name}`} onPress={() => onChangeQuantity(1)} disabled={disabled} style={styles.stepperAction}><Text style={styles.stepperButton}>+</Text></Pressable>
          </View>}
        </View>
      </View>
    </View>
  );
}

export default function SamagriScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string>();
  const categories = useQuery({ queryKey: ["product-categories"], queryFn: getCategories });
  const products = useQuery({ queryKey: ["products", categoryId, search], queryFn: () => getProducts({ categoryId, search: search.trim() || undefined }) });
  const cart = useQuery({ queryKey: ["cart"], queryFn: getCart });
  const cartMutation = useMutation({ mutationFn: ({ productId, itemId, quantity }: { productId: string; itemId?: string; quantity: number }) => quantity <= 0 ? removeCartItem(itemId!) : itemId ? updateCartItem(itemId, quantity) : addCartItem(productId, quantity), onSuccess: (data: Cart) => queryClient.setQueryData(["cart"], data) });
  const itemCount = cart.data?.itemCount ?? 0;
  const cartTotal = cart.data?.total ?? 0;
  const listBottomPadding = itemCount > 0 ? CART_BAR_HEIGHT + insets.bottom + spacing.lg : spacing.lg;
  const categoryItems = categories.data?.length ? categories.data.map((category) => ({ id: category.id, name: category.name })) : categoryLabels.map((name) => ({ id: name, name }));

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.screenContainer}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} hitSlop={10} style={styles.headerButton}><Text style={styles.back}>‹</Text></Pressable>
          <Text style={styles.title}>Pooja Samagri</Text>
          <Pressable accessibilityRole="button" accessibilityLabel={`Cart, ${itemCount} items`} onPress={() => router.push("/(protected)/cart")} hitSlop={8} style={styles.cartButton}><Text style={styles.cartIcon}>🛒</Text>{itemCount > 0 ? <View style={styles.cartBadge}><Text style={styles.cartBadgeText}>{itemCount}</Text></View> : null}</Pressable>
        </View>
        <DharmaSearchBar value={search} onChangeText={setSearch} placeholder="Search items..." onMicPress={() => {}} style={styles.search} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} style={styles.categoryScroll}>
          {categoryItems.map((category) => <Pressable key={category.id} onPress={() => setCategoryId(categoryId === category.id ? undefined : category.id)} style={[styles.chip, categoryId === category.id && styles.chipActive]}><Text style={[styles.chipText, categoryId === category.id && styles.chipTextActive]}>{category.name}</Text></Pressable>)}
        </ScrollView>
        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Popular Kits</Text><Pressable accessibilityRole="button" accessibilityLabel="View all kits" hitSlop={8}><Text style={styles.viewAll}>View All  ›</Text></Pressable></View>
        {products.isLoading ? <View style={styles.state}><ActivityIndicator color={colors.primary} /></View> : products.isError ? <View style={styles.state}><Text style={styles.stateText}>Products could not be loaded.</Text><Pressable onPress={() => products.refetch()}><Text style={styles.retry}>Retry</Text></Pressable></View> : <FlatList
          data={products.data?.items ?? []}
          keyExtractor={(product) => product.id}
          renderItem={({ item, index }) => { const cartItem = cart.data?.items.find((entry) => entry.productId === item.id); const quantity = cartItem?.quantity ?? 0; return <ProductCard product={item} index={index} quantity={quantity} disabled={cartMutation.isPending} onAdd={() => cartMutation.mutate({ productId: item.id, quantity: 1 })} onChangeQuantity={(change) => cartItem && cartMutation.mutate({ productId: item.id, itemId: cartItem.id, quantity: quantity + change })} />; }}
          contentContainerStyle={[styles.list, { paddingBottom: listBottomPadding }]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<View style={styles.state}><Text style={styles.stateText}>No products match your search.</Text></View>}
        />}
        {cartMutation.isError ? <Text style={styles.cartError}>{getErrorMessage(cartMutation.error, "Unable to update your cart.")}</Text> : null}
        {itemCount > 0 ? <View style={[styles.cartBar, { bottom: Math.max(insets.bottom, spacing.sm) }]}><Text style={styles.cartBarIcon}>🛒</Text><Text style={styles.cartSummary}>{itemCount} {itemCount === 1 ? "Item" : "Items"}  •  \u20B9{cartTotal.toLocaleString("en-IN")}</Text><Pressable accessibilityRole="button" accessibilityLabel="View cart" onPress={() => router.push("/(protected)/cart")} style={styles.viewCart}><Text style={styles.viewCartText}>View Cart  →</Text></Pressable></View> : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.warmCream },
  screenContainer: { flex: 1, paddingHorizontal: spacing.md, backgroundColor: colors.warmCream },
  header: { height: 64, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerButton: { width: 40 },
  back: { color: colors.text, fontSize: 40, fontWeight: "300", lineHeight: 42 },
  title: { color: colors.text, fontSize: 22, fontWeight: "800" },
  cartButton: { width: 40, alignItems: "center" },
  cartIcon: { fontSize: 25 },
  cartBadge: { position: "absolute", top: -5, right: -2, width: 24, height: 24, borderRadius: 12, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  cartBadgeText: { color: colors.white, fontSize: 13, fontWeight: "800" },
  search: { marginBottom: spacing.sm },
  categoryScroll: { flexGrow: 0 },
  chips: { gap: spacing.sm, paddingVertical: spacing.md },
  chip: { minHeight: 44, minWidth: 82, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.full, paddingHorizontal: spacing.md, backgroundColor: colors.warmCreamLight },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontSize: 15, fontWeight: "600" },
  chipTextActive: { color: colors.white },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: spacing.xs, paddingBottom: spacing.sm },
  sectionTitle: { fontSize: 24, fontWeight: "800", color: colors.text },
  viewAll: { color: colors.primary, fontSize: 16, fontWeight: "700" },
  list: { gap: spacing.sm },
  card: { flexDirection: "row", backgroundColor: colors.cardBackground, borderRadius: borderRadius.lg, padding: spacing.sm, minHeight: 176, ...shadows.sm },
  imageFrame: { width: 132, height: 156, borderRadius: borderRadius.md, overflow: "hidden", backgroundColor: colors.saffronLight },
  image: { width: "100%", height: "100%" },
  imagePlaceholder: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.warmCreamDark },
  imagePlaceholderText: { color: colors.primary, fontSize: 17, fontWeight: "800" },
  imagePlaceholderSubtext: { color: colors.textMuted, fontSize: 11, marginTop: spacing.xs },
  bestseller: { position: "absolute", left: 0, top: 0, backgroundColor: colors.primary, paddingHorizontal: 9, paddingVertical: 7, borderBottomRightRadius: borderRadius.sm },
  bestsellerText: { color: colors.white, fontSize: 13, fontWeight: "800" },
  productInfo: { flex: 1, minWidth: 0, paddingLeft: spacing.md, justifyContent: "space-between" },
  nameRow: { flexDirection: "row", alignItems: "flex-start", minHeight: 44 },
  name: { flex: 1, color: colors.text, fontSize: 18, lineHeight: 23, fontWeight: "800", paddingRight: spacing.xs },
  favorite: { width: 32, alignItems: "flex-end" },
  favoriteIcon: { color: colors.textMuted, fontSize: 31, lineHeight: 31 },
  description: { color: colors.textMuted, fontSize: 15, lineHeight: 20, marginTop: spacing.xs, flexShrink: 1 },
  productBottomRow: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap: spacing.sm, marginTop: spacing.sm },
  priceStock: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: spacing.xs },
  price: { color: colors.primary, fontSize: 21, fontWeight: "800" },
  stock: { color: colors.green, backgroundColor: colors.greenLight, borderRadius: borderRadius.full, paddingHorizontal: 9, paddingVertical: 6, fontSize: 13, fontWeight: "600" },
  unavailable: { color: colors.error, backgroundColor: colors.errorLight, borderRadius: borderRadius.full, paddingHorizontal: 8, paddingVertical: 6, fontSize: 12, fontWeight: "600" },
  stepper: { width: 130, height: 44, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.full, backgroundColor: colors.warmCreamLight },
  stepperAction: { width: 40, height: 42, alignItems: "center", justifyContent: "center" },
  stepperButton: { color: colors.primary, fontSize: 25, lineHeight: 28 },
  quantity: { color: colors.text, fontSize: 18, fontWeight: "700" },
  addButton: { minWidth: 130, height: 44, alignItems: "center", justifyContent: "center", borderRadius: borderRadius.full, backgroundColor: colors.primary, paddingHorizontal: spacing.sm },
  addButtonText: { color: colors.white, fontSize: 13, fontWeight: "800" },
  state: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl },
  stateText: { color: colors.textMuted },
  retry: { color: colors.primary, fontWeight: "700", marginTop: spacing.sm },
  cartBar: { position: "absolute", left: spacing.md, right: spacing.md, minHeight: CART_BAR_HEIGHT, borderRadius: borderRadius.lg, backgroundColor: colors.primary, flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.md, ...shadows.lg },
  cartBarIcon: { fontSize: 26, marginRight: spacing.sm },
  cartSummary: { flex: 1, color: colors.white, fontSize: 17, fontWeight: "800" },
  viewCart: { borderWidth: 1.5, borderColor: colors.white, borderRadius: borderRadius.full, paddingHorizontal: spacing.md, paddingVertical: 11 },
  viewCartText: { color: colors.white, fontSize: 15, fontWeight: "800" },
  cartError: { color: colors.error, textAlign: "center", paddingVertical: spacing.xs },
});
