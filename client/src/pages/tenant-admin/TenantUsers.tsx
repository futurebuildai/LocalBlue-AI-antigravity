import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Users as UsersIcon, Mail } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { usePreview } from "@/contexts/PreviewContext";
import type { TenantUser } from "@shared/schema";

type SanitizedUser = Omit<TenantUser, "password">;

const userFormSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["owner", "admin", "editor", "viewer"]).default("editor"),
});

type UserFormValues = z.infer<typeof userFormSchema>;

export default function TenantUsers() {
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { getApiPath } = usePreview();

  const { data: users = [], isLoading } = useQuery<SanitizedUser[]>({
    queryKey: [getApiPath("/api/tenant/users")],
  });

  const { data: settings } = useQuery<{ subscriptionPlan?: string }>({
    queryKey: [getApiPath("/api/tenant/settings")],
  });

  // Calculate seat limits
  const subscriptionPlan = settings?.subscriptionPlan || "starter";
  const seatLimits: Record<string, number> = {
    starter: 1,
    growth: 3,
    scale: 999 // Unlimited for practical purposes
  };
  const maxSeats = seatLimits[subscriptionPlan];
  const currentSeats = users.length;
  const isAtSeatLimit = currentSeats >= maxSeats;

  const createMutation = useMutation({
    mutationFn: async (data: UserFormValues) => {
      return apiRequest("POST", getApiPath("/api/tenant/users"), data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [getApiPath("/api/tenant/users")] });
      setIsCreateOpen(false);
      toast({ title: "User created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create user", description: error.message, variant: "destructive" });
    },
  });

  const handleCreate = (values: UserFormValues) => {
    createMutation.mutate(values);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight" data-testid="text-tenant-users-title">
            Users
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">Manage users for your site</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="min-h-[44px]" disabled={isAtSeatLimit} data-testid="button-create-tenant-user">
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md mx-auto">
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription>Create a new user for your site</DialogDescription>
            </DialogHeader>
            <UserForm onSubmit={handleCreate} isLoading={createMutation.isPending} />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="text-base sm:text-lg">Site Users</CardTitle>
          <CardDescription className="text-sm">
            {users.length} of {maxSeats === 999 ? "unlimited" : maxSeats} seats used
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
          {users.length > 0 ? (
            <div className="space-y-2 sm:space-y-3">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 p-3 sm:p-4 rounded-lg border bg-card min-h-[56px]"
                  data-testid={`row-tenant-user-${user.id}`}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 flex-shrink-0">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="font-medium block truncate" data-testid={`text-user-email-${user.id}`}>
                      {user.email}
                    </span>
                    <span className="text-xs text-muted-foreground capitalize">{user.role || 'Editor'}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <UsersIcon className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No users yet</h3>
              <p className="text-muted-foreground text-sm mb-4">Add your first user to get started</p>
              <Button className="min-h-[44px]" onClick={() => setIsCreateOpen(true)} data-testid="button-create-first-tenant-user">
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function UserForm({
  onSubmit,
  isLoading,
}: {
  onSubmit: (values: UserFormValues) => void;
  isLoading: boolean;
}) {
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      email: "",
      password: "",
      role: "editor",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="user@example.com"
                  className="min-h-[44px]"
                  {...field}
                  data-testid="input-tenant-user-email"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Minimum 6 characters"
                  className="min-h-[44px]"
                  {...field}
                  data-testid="input-tenant-user-password"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <FormControl>
                <select
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background min-h-[44px] focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  {...field}
                  data-testid="select-tenant-user-role"
                >
                  <option value="owner">Owner</option>
                  <option value="admin">Admin</option>
                  <option value="editor">Editor</option>
                  <option value="viewer">Viewer</option>
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2 pt-4">
          <Button type="submit" className="min-h-[44px]" disabled={isLoading} data-testid="button-submit-tenant-user">
            {isLoading ? "Creating..." : "Create User"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
