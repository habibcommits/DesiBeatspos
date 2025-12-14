import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Loader2,
  ClipboardList,
  Search,
  Eye,
  Printer,
  XCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { printReceipt } from "@/lib/print-utils";
import type { Order, Settings } from "@shared/schema";

export default function OrdersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    refetchInterval: 10000,
  });

  const { data: settings } = useQuery<Settings>({
    queryKey: ["/api/settings"],
  });

  const currency = settings?.currency || "Rs.";

  const cancelMutation = useMutation({
    mutationFn: async (orderId: string) => {
      return apiRequest("PATCH", `/api/orders/${orderId}/status`, {
        status: "cancelled",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Order cancelled",
        description: "The order has been cancelled",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel order",
        variant: "destructive",
      });
    },
  });

  const filteredOrders = orders?.filter((order) => {
    const matchesSearch =
      searchQuery === "" ||
      order.orderNumber.toString().includes(searchQuery) ||
      order.customerName?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "preparing":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "served":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "billed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handlePrint = (order: Order) => {
    if (settings) {
      printReceipt(order, settings);
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
            <ClipboardList className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-semibold text-lg">Orders</h1>
            <p className="text-sm text-muted-foreground">
              {orders?.length || 0} total orders
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-[200px]"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="preparing">Preparing</SelectItem>
              <SelectItem value="served">Served</SelectItem>
              <SelectItem value="billed">Billed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        {filteredOrders?.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <ClipboardList className="h-12 w-12 mb-4" />
            <p>No orders found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders?.map((order) => (
              <Card key={order._id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center font-mono font-bold text-primary">
                        #{order.orderNumber}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium capitalize">
                            {order.type}
                          </span>
                          {order.tableName && (
                            <span className="text-muted-foreground">
                              • {order.tableName}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {order.items.length} items • {formatDate(order.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                      <span className="font-semibold">
                        {currency} {order.total.toLocaleString()}
                      </span>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedOrder(order)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handlePrint(order)}
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                        {order.status === "preparing" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => cancelMutation.mutate(order._id)}
                            disabled={cancelMutation.isPending}
                          >
                            <XCircle className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>

      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Order #{selectedOrder?.orderNumber}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(selectedOrder.status)}>
                  {selectedOrder.status}
                </Badge>
                <span className="capitalize">{selectedOrder.type}</span>
                {selectedOrder.tableName && (
                  <span>• {selectedOrder.tableName}</span>
                )}
              </div>

              <div className="space-y-2">
                {selectedOrder.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-muted rounded-md"
                  >
                    <div>
                      <p className="font-medium">
                        {item.quantity}x {item.productName}
                      </p>
                      {item.variant && (
                        <p className="text-sm text-muted-foreground">
                          {item.variant}
                        </p>
                      )}
                    </div>
                    <span>
                      {currency} {(item.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>{currency} {selectedOrder.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax</span>
                  <span>{currency} {selectedOrder.taxAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>{currency} {selectedOrder.total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
