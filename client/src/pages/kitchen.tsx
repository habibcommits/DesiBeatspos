import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, ChefHat, Check, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Order } from "@shared/schema";

export default function KitchenPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    refetchInterval: 5000,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return apiRequest("PATCH", `/api/orders/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Order updated",
        description: "Order status has been updated",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update order",
        variant: "destructive",
      });
    },
  });

  const preparingOrders = orders?.filter((o) => o.status === "preparing") || [];

  const handleMarkServed = (orderId: string) => {
    updateStatusMutation.mutate({ id: orderId, status: "served" });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTimeElapsed = (dateString: string) => {
    const start = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    return diffMins;
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
            <ChefHat className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-semibold text-lg">Kitchen Display</h1>
            <p className="text-sm text-muted-foreground">
              {preparingOrders.length} orders preparing
            </p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        {preparingOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <ChefHat className="h-12 w-12 mb-4" />
            <p>No orders in the kitchen</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {preparingOrders.map((order) => {
              const timeElapsed = getTimeElapsed(order.createdAt);
              const isUrgent = timeElapsed > 15;

              return (
                <Card
                  key={order._id}
                  className={isUrgent ? "border-red-500" : ""}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        Order #{order.orderNumber}
                      </CardTitle>
                      <Badge variant={isUrgent ? "destructive" : "secondary"}>
                        <Clock className="w-3 h-3 mr-1" />
                        {timeElapsed}m
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="capitalize">{order.type}</span>
                      {order.tableName && (
                        <>
                          <span>•</span>
                          <span>{order.tableName}</span>
                        </>
                      )}
                      <span>•</span>
                      <span>{formatTime(order.createdAt)}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 mb-4">
                      {order.items.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-start justify-between p-2 bg-muted rounded-md"
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
                            {item.notes && (
                              <p className="text-sm text-yellow-600 dark:text-yellow-400">
                                Note: {item.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    {order.notes && (
                      <p className="text-sm text-muted-foreground mb-4 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
                        Order Note: {order.notes}
                      </p>
                    )}
                    <Button
                      className="w-full"
                      onClick={() => handleMarkServed(order._id)}
                      disabled={updateStatusMutation.isPending}
                    >
                      {updateStatusMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="mr-2 h-4 w-4" />
                      )}
                      Mark as Served
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
