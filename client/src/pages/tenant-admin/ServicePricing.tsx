import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient, getQueryFn } from "@/lib/queryClient";
import { usePreview } from "@/contexts/PreviewContext";
import { Plus, DollarSign, Pencil, Trash2, Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface ServicePricingItem {
  id: number;
  siteId: string;
  serviceName: string;
  basePrice: number;
  priceUnit: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
}

const pricingSchema = z.object({
  serviceName: z.string().min(1, "Service name is required"),
  basePrice: z.coerce.number().min(0, "Price must be 0 or more"),
  priceUnit: z.string().min(1, "Price unit is required"),
  description: z.string().optional(),
});

type PricingFormValues = z.infer<typeof pricingSchema>;

const PRICE_UNITS = [
  "per job",
  "per hour",
  "per sq ft",
  "per linear ft",
  "per unit",
  "flat rate",
  "starting at",
];

export default function ServicePricing() {
  const { toast } = useToast();
  const { getApiPath } = usePreview();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ServicePricingItem | null>(null);

  const { data: pricing = [], isLoading } = useQuery<ServicePricingItem[]>({
    queryKey: [getApiPath("/api/tenant/service-pricing")],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const form = useForm<PricingFormValues>({
    resolver: zodResolver(pricingSchema),
    defaultValues: {
      serviceName: "",
      basePrice: 0,
      priceUnit: "per job",
      description: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: PricingFormValues) => {
      const res = await apiRequest("POST", getApiPath("/api/tenant/service-pricing"), values);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Service pricing added" });
      queryClient.invalidateQueries({ queryKey: [getApiPath("/api/tenant/service-pricing")] });
      setDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ title: "Failed to add pricing", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: { id: number; values: PricingFormValues }) => {
      const res = await apiRequest("PATCH", getApiPath(`/api/tenant/service-pricing/${id}`), values);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Service pricing updated" });
      queryClient.invalidateQueries({ queryKey: [getApiPath("/api/tenant/service-pricing")] });
      setDialogOpen(false);
      setEditingItem(null);
      form.reset();
    },
    onError: () => {
      toast({ title: "Failed to update pricing", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", getApiPath(`/api/tenant/service-pricing/${id}`));
    },
    onSuccess: () => {
      toast({ title: "Service pricing removed" });
      queryClient.invalidateQueries({ queryKey: [getApiPath("/api/tenant/service-pricing")] });
    },
    onError: () => {
      toast({ title: "Failed to remove pricing", variant: "destructive" });
    },
  });

  const openCreate = () => {
    setEditingItem(null);
    form.reset({ serviceName: "", basePrice: 0, priceUnit: "per job", description: "" });
    setDialogOpen(true);
  };

  const openEdit = (item: ServicePricingItem) => {
    setEditingItem(item);
    form.reset({
      serviceName: item.serviceName,
      basePrice: item.basePrice,
      priceUnit: item.priceUnit,
      description: item.description || "",
    });
    setDialogOpen(true);
  };

  const onSubmit = (values: PricingFormValues) => {
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, values });
    } else {
      createMutation.mutate(values);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Service Pricing</h2>
          <p className="text-muted-foreground">Manage your service rates and pricing. These rates help AI agents generate accurate bid proposals.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Add Service
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingItem ? "Edit Service Pricing" : "Add Service Pricing"}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="serviceName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Drain Cleaning" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="basePrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Base Price ($)</FormLabel>
                        <FormControl>
                          <Input type="number" min={0} step={1} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="priceUnit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price Unit</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {PRICE_UNITS.map((unit) => (
                              <SelectItem key={unit} value={unit}>
                                {unit}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (optional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Brief description of what's included" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isPending}>
                  {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingItem ? "Update" : "Add"} Service Pricing
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : pricing.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <DollarSign className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">
              No service pricing added yet. Add your rates so AI agents can generate accurate bid proposals.
            </p>
            <Button variant="outline" onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Service
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {pricing.map((item) => (
            <Card key={item.id}>
              <CardContent className="flex items-center justify-between py-4 px-6">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-base">{item.serviceName}</h3>
                    <span className="text-sm font-medium px-2.5 py-0.5 bg-primary/10 text-primary rounded-full">
                      ${item.basePrice} {item.priceUnit}
                    </span>
                  </div>
                  {item.description && (
                    <p className="text-sm text-muted-foreground mt-1 truncate">{item.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteMutation.mutate(item.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
