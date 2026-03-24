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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient, getQueryFn } from "@/lib/queryClient";
import { usePreview } from "@/contexts/PreviewContext";
import { Plus, Star, Pencil, Trash2, Loader2, Quote } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface TestimonialItem {
  id: number;
  siteId: string;
  customerName: string;
  customerLocation: string | null;
  rating: number;
  content: string;
  projectType: string | null;
  isVisible: boolean;
  createdAt: string;
}

const testimonialSchema = z.object({
  customerName: z.string().min(1, "Customer name is required"),
  customerLocation: z.string().optional(),
  rating: z.coerce.number().min(1).max(5),
  content: z.string().min(5, "Review must be at least 5 characters"),
  projectType: z.string().optional(),
});

type TestimonialFormValues = z.infer<typeof testimonialSchema>;

function StarRating({ rating, onChange }: { rating: number; onChange?: (r: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange?.(star)}
          className={onChange ? "cursor-pointer" : "cursor-default"}
        >
          <Star
            className={`h-5 w-5 ${star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300 dark:text-gray-600"}`}
          />
        </button>
      ))}
    </div>
  );
}

export default function Testimonials() {
  const { toast } = useToast();
  const { getApiPath } = usePreview();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TestimonialItem | null>(null);

  const { data: testimonials = [], isLoading } = useQuery<TestimonialItem[]>({
    queryKey: [getApiPath("/api/tenant/testimonials")],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const form = useForm<TestimonialFormValues>({
    resolver: zodResolver(testimonialSchema),
    defaultValues: {
      customerName: "",
      customerLocation: "",
      rating: 5,
      content: "",
      projectType: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: TestimonialFormValues) => {
      const res = await apiRequest("POST", getApiPath("/api/tenant/testimonials"), values);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Testimonial added" });
      queryClient.invalidateQueries({ queryKey: [getApiPath("/api/tenant/testimonials")] });
      setDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ title: "Failed to add testimonial", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: { id: number; values: TestimonialFormValues }) => {
      const res = await apiRequest("PATCH", getApiPath(`/api/tenant/testimonials/${id}`), values);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Testimonial updated" });
      queryClient.invalidateQueries({ queryKey: [getApiPath("/api/tenant/testimonials")] });
      setDialogOpen(false);
      setEditingItem(null);
      form.reset();
    },
    onError: () => {
      toast({ title: "Failed to update testimonial", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", getApiPath(`/api/tenant/testimonials/${id}`));
    },
    onSuccess: () => {
      toast({ title: "Testimonial removed" });
      queryClient.invalidateQueries({ queryKey: [getApiPath("/api/tenant/testimonials")] });
    },
    onError: () => {
      toast({ title: "Failed to remove testimonial", variant: "destructive" });
    },
  });

  const openCreate = () => {
    setEditingItem(null);
    form.reset({ customerName: "", customerLocation: "", rating: 5, content: "", projectType: "" });
    setDialogOpen(true);
  };

  const openEdit = (item: TestimonialItem) => {
    setEditingItem(item);
    form.reset({
      customerName: item.customerName,
      customerLocation: item.customerLocation || "",
      rating: item.rating,
      content: item.content,
      projectType: item.projectType || "",
    });
    setDialogOpen(true);
  };

  const onSubmit = (values: TestimonialFormValues) => {
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
          <h2 className="text-2xl font-bold tracking-tight">Testimonials</h2>
          <p className="text-muted-foreground">Manage customer reviews displayed on your website.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Add Testimonial
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingItem ? "Edit Testimonial" : "Add Testimonial"}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="customerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. John Smith" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="customerLocation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location (optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Austin, TX" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="projectType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Type (optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Kitchen Remodel" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="rating"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rating</FormLabel>
                      <FormControl>
                        <StarRating rating={field.value} onChange={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Review</FormLabel>
                      <FormControl>
                        <Textarea rows={4} placeholder="What did the customer say?" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isPending}>
                  {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingItem ? "Update" : "Add"} Testimonial
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
      ) : testimonials.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Quote className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">
              No testimonials added yet. Customer reviews build trust and help convert visitors.
            </p>
            <Button variant="outline" onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Testimonial
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {testimonials.map((item) => (
            <Card key={item.id}>
              <CardContent className="py-5 px-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold">{item.customerName}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {item.customerLocation && <span>{item.customerLocation}</span>}
                      {item.projectType && (
                        <>
                          {item.customerLocation && <span>&middot;</span>}
                          <span>{item.projectType}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(item)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => deleteMutation.mutate(item.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
                <StarRating rating={item.rating} />
                <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{item.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
