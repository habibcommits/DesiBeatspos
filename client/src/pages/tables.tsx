import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Layout, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCart } from "@/lib/cart-context";
import { useToast } from "@/hooks/use-toast";
import type { Table as TableType, Order, Settings } from "@shared/schema";

export default function TablesPage() {
  const { setSelectedTable, selectedTable } = useCart();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tables, isLoading } = useQuery<TableType[]>({
    queryKey: ["/api/tables"],
  });

  const { data: orders } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const { data: settings } = useQuery<Settings>({
    queryKey: ["/api/settings"],
  });

  const currency = settings?.currency || "Rs.";

  const getTableOrder = (tableId: string) => {
    return orders?.find(
      (o) => o.tableId === tableId && !["billed", "cancelled"].includes(o.status)
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "occupied":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "billed":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const handleTableClick = (table: TableType) => {
    if (selectedTable?._id === table._id) {
      setSelectedTable(null);
      toast({
        title: "Table deselected",
        description: "Switched to takeaway mode",
      });
    } else {
      setSelectedTable(table);
      toast({
        title: "Table selected",
        description: `Now serving ${table.name}`,
      });
    }
  };

  if (isLoading) {
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
            <Layout className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-semibold text-lg">Tables</h1>
            <p className="text-sm text-muted-foreground">
              Select a table for dine-in orders
            </p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {tables?.map((table) => {
            const order = getTableOrder(table._id);
            const isSelected = selectedTable?._id === table._id;

            return (
              <Card
                key={table._id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  isSelected ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => handleTableClick(table)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">{table.name}</span>
                    {isSelected && (
                      <Check className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  <Badge className={getStatusColor(table.status)}>
                    {table.status}
                  </Badge>
                  <p className="text-sm text-muted-foreground mt-2">
                    Capacity: {table.capacity}
                  </p>
                  {order && (
                    <div className="mt-2 pt-2 border-t">
                      <p className="text-xs text-muted-foreground">
                        Order #{order.orderNumber}
                      </p>
                      <p className="text-sm font-medium">
                        {currency} {order.total.toLocaleString()}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
