import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Users as UsersIcon, Mail } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import type { User } from "@shared/schema";

type SanitizedUser = Omit<User, "password">;

const userFormSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type UserFormValues = z.infer<typeof userFormSchema>;

export default function TenantUsers() {
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data: users = [], isLoading } = useQuery<SanitizedUser[]>({
    queryKey: ["/api/tenant/users"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: UserFormValues) => {
      return apiRequest("POST", "/api/tenant/users", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenant/users"] });
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
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-tenant-users-title">
            Users
          </h1>
          <p className="text-muted-foreground">Manage users for your site</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-tenant-user">
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription>Create a new user for your site</DialogDescription>
            </DialogHeader>
            <UserForm onSubmit={handleCreate} isLoading={createMutation.isPending} />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Site Users</CardTitle>
          <CardDescription>{users.length} users in your site</CardDescription>
        </CardHeader>
        <CardContent>
          {users.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} data-testid={`row-tenant-user-${user.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium" data-testid={`text-user-email-${user.id}`}>
                          {user.email}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <UsersIcon className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No users yet</h3>
              <p className="text-muted-foreground text-sm mb-4">Add your first user to get started</p>
              <Button onClick={() => setIsCreateOpen(true)} data-testid="button-create-first-tenant-user">
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
                  {...field} 
                  data-testid="input-tenant-user-password" 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2 pt-4">
          <Button type="submit" disabled={isLoading} data-testid="button-submit-tenant-user">
            {isLoading ? "Creating..." : "Create User"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
