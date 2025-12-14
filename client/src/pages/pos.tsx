import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ShoppingBag } from "lucide-react";
import { CategoryTabs } from "@/components/pos/category-tabs";
import { ProductGrid } from "@/components/pos/product-grid";
import { TableSelectDialog } from "@/components/pos/table-select-dialog";
import { useCart } from "@/lib/cart-context";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Category, Product, Table as TableType, Settings } from "@shared/schema";

export default function POSPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [tableDialogOpen, setTableDialogOpen] = useState(false);
  const { addToCart, selectedTable, setSelectedTable } = useCart();

  const { data: categories, isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: tables } = useQuery<TableType[]>({
    queryKey: ["/api/tables"],
  });

  const { data: settings } = useQuery<Settings>({
    queryKey: ["/api/settings"],
  });

  const activeCategories = categories?.filter((c) => c.isActive) || [];
  const availableProducts = products?.filter((p) => p.isAvailable) || [];

  const filteredProducts = selectedCategory
    ? availableProducts.filter((p) => p.categoryId === selectedCategory)
    : availableProducts;

  const handleProductClick = (product: Product, variant?: string) => {
    addToCart(product, variant);
  };

  const handleTableSelect = (table: TableType | null) => {
    setSelectedTable(table);
  };

  if (categoriesLoading || productsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-border gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <ShoppingBag className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-semibold text-lg">Point of Sale</h1>
            <p className="text-sm text-muted-foreground">
              {selectedTable ? `Table: ${selectedTable.name}` : "Takeaway"}
            </p>
          </div>
        </div>
      </div>

      <CategoryTabs
        categories={activeCategories}
        selectedCategoryId={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      <ProductGrid
        products={filteredProducts}
        categories={categories}
        onAddToCart={handleProductClick}
        settings={settings || null}
      />

      <TableSelectDialog
        open={tableDialogOpen}
        onClose={() => setTableDialogOpen(false)}
        tables={tables || []}
        onSelect={handleTableSelect}
        selectedTableId={selectedTable?._id}
      />
    </div>
  );
}
