import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Users as UsersIcon, Mail } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import type { Site, TenantUser, InsertTenantUser } from "@shared/schema";

type SanitizedUser = Omit<TenantUser, "password">;

const userFormSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  siteId: z.string().optional().nullable(),
});

const userUpdateSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().optional(),
  siteId: z.string().optional().nullable(),
});

type UserFormValues = z.infer<typeof userFormSchema>;
type UserUpdateValues = z.infer<typeof userUpdateSchema>;

export default function Users() {
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<SanitizedUser | null>(null);

  const { data: users = [], isLoading: usersLoading } = useQuery<SanitizedUser[]>({
    queryKey: ["/api/admin/users"],
  });

  const { data: sites = [], isLoading: sitesLoading } = useQuery<Site[]>({
    queryKey: ["/api/admin/sites"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertTenantUser) => {
      return apiRequest("POST", "/api/admin/users", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setIsCreateOpen(false);
      toast({ title: "User created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create user", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertTenantUser> }) => {
      return apiRequest("PATCH", `/api/admin/users/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setEditingUser(null);
      toast({ title: "User updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update user", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/admin/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete user", description: error.message, variant: "destructive" });
    },
  });

  const handleCreate = (values: UserFormValues) => {
    createMutation.mutate({
      email: values.email,
      password: values.password,
      siteId: values.siteId && values.siteId !== "none" ? values.siteId : null,
    });
  };

  const handleUpdate = (values: UserUpdateValues) => {
    if (!editingUser) return;
    const updateData: Partial<InsertTenantUser> = {
      email: values.email,
      siteId: values.siteId && values.siteId !== "none" ? values.siteId : null,
    };
    if (values.password) {
      updateData.password = values.password;
    }
    updateMutation.mutate({
      id: editingUser.id,
      data: updateData,
    });
  };

  const getSiteName = (siteId: string | null) => {
    if (!siteId) return "No site";
    const site = sites.find((s) => s.id === siteId);
    return site?.businessName || "Unknown site";
  };

  if (usersLoading || sitesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight" data-testid="text-users-title">Users</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Manage users across all tenants</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-user" className="w-full sm:w-auto min-h-[44px]">
              <Plus className="h-4 w-4 mr-2" />
              Create User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md w-[calc(100%-2rem)] sm:w-full max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>Add a new user to a tenant site</DialogDescription>
            </DialogHeader>
            <UserForm onSubmit={handleCreate} isLoading={createMutation.isPending} sites={sites} />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>{users.length} users across all tenants</CardDescription>
        </CardHeader>
        <CardContent>
          {users.length > 0 ? (
            <div className="overflow-x-auto -mx-6 px-6">
              <Table className="min-w-[500px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[180px]">Email</TableHead>
                    <TableHead className="min-w-[140px]">Site</TableHead>
                    <TableHead className="text-right min-w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => {
                    const userSite = sites.find((s) => s.id === user.siteId);
                    return (
                      <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="font-medium break-all">{user.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {userSite ? (
                            <div className="flex items-center gap-2">
                              <div
                                className="h-6 w-6 rounded flex items-center justify-center text-white text-xs font-medium shrink-0"
                                style={{ backgroundColor: userSite.brandColor }}
                              >
                                {userSite.businessName.charAt(0)}
                              </div>
                              <span className="truncate">{userSite.businessName}</span>
                            </div>
                          ) : (
                            <Badge variant="secondary">No site</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Dialog open={editingUser?.id === user.id} onOpenChange={(open) => !open && setEditingUser(null)}>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={() => setEditingUser(user)} data-testid={`button-edit-user-${user.id}`}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-md w-[calc(100%-2rem)] sm:w-full max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Edit User</DialogTitle>
                                  <DialogDescription>Update user details</DialogDescription>
                                </DialogHeader>
                                <UserUpdateForm
                                  onSubmit={handleUpdate}
                                  isLoading={updateMutation.isPending}
                                  sites={sites}
                                  defaultValues={{
                                    email: user.email,
                                    siteId: user.siteId || "",
                                  }}
                                />
                              </DialogContent>
                            </Dialog>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" data-testid={`button-delete-user-${user.id}`}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="w-[calc(100%-2rem)] sm:w-full max-w-md">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete User</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{user.email}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                                  <AlertDialogCancel className="min-h-[44px]">Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteMutation.mutate(user.id)} className="min-h-[44px]">
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <UsersIcon className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No users yet</h3>
              <p className="text-muted-foreground text-sm mb-4">Create your first user to get started</p>
              <Button onClick={() => setIsCreateOpen(true)} data-testid="button-create-first-user">
                <Plus className="h-4 w-4 mr-2" />
                Create User
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
  sites,
}: {
  onSubmit: (values: UserFormValues) => void;
  isLoading: boolean;
  sites: Site[];
}) {
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      email: "",
      password: "",
      siteId: "",
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
                <Input type="email" placeholder="user@example.com" {...field} data-testid="input-user-email" />
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
                <Input type="password" placeholder="Enter password" {...field} data-testid="input-user-password" />
              </FormControl>
              <FormDescription>At least 6 characters</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="siteId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Assign to Site</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ""}>
                <FormControl>
                  <SelectTrigger data-testid="select-user-site">
                    <SelectValue placeholder="Select a site" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">No site</SelectItem>
                  {sites.map((site) => (
                    <SelectItem key={site.id} value={site.id}>
                      {site.businessName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full min-h-[44px]" disabled={isLoading} data-testid="button-submit-user">
          {isLoading ? "Creating..." : "Create User"}
        </Button>
      </form>
    </Form>
  );
}

function UserUpdateForm({
  onSubmit,
  isLoading,
  sites,
  defaultValues,
}: {
  onSubmit: (values: UserUpdateValues) => void;
  isLoading: boolean;
  sites: Site[];
  defaultValues: { email: string; siteId: string };
}) {
  const form = useForm<UserUpdateValues>({
    resolver: zodResolver(userUpdateSchema),
    defaultValues: {
      email: defaultValues.email,
      password: "",
      siteId: defaultValues.siteId,
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
                <Input type="email" placeholder="user@example.com" {...field} data-testid="input-edit-user-email" />
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
              <FormLabel>New Password (optional)</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Leave blank to keep current" {...field} data-testid="input-edit-user-password" />
              </FormControl>
              <FormDescription>Leave blank to keep current password</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="siteId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Assign to Site</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ""}>
                <FormControl>
                  <SelectTrigger data-testid="select-edit-user-site">
                    <SelectValue placeholder="Select a site" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">No site</SelectItem>
                  {sites.map((site) => (
                    <SelectItem key={site.id} value={site.id}>
                      {site.businessName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full min-h-[44px]" disabled={isLoading} data-testid="button-update-user">
          {isLoading ? "Updating..." : "Update User"}
        </Button>
      </form>
    </Form>
  );
}
