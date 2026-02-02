import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, Users, CreditCard, TrendingUp } from "lucide-react";

interface SubscriptionStats {
  active_subscriptions: string | number;
  trialing_subscriptions: string | number;
  past_due_subscriptions: string | number;
  canceled_subscriptions: string | number;
  monthly_recurring_revenue: string | number;
}

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created: number;
  customer_email: string;
  customer_name: string;
}

interface MonthlyRevenue {
  month: string;
  revenue: string | number;
  transaction_count: string | number;
}

interface CustomerStats {
  total_customers: string | number;
}

interface SiteBreakdown {
  subscription_plan: string;
  trial_phase: string;
  count: string | number;
}

interface RevenueData {
  subscriptions: SubscriptionStats;
  recentPayments: Payment[];
  monthlyRevenue: MonthlyRevenue[];
  customers: CustomerStats;
  siteBreakdown: SiteBreakdown[];
}

function formatCurrency(amount: number | string, currency: string = "usd"): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(num);
}

function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatMonth(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

function getStatusBadgeVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "succeeded":
      return "default";
    case "pending":
      return "secondary";
    case "failed":
      return "destructive";
    default:
      return "outline";
  }
}

function getPlanDisplayName(plan: string | null): string {
  if (!plan) return "Unknown";
  return plan.charAt(0).toUpperCase() + plan.slice(1);
}

function getPhaseDisplayName(phase: string | null): string {
  if (!phase) return "Unknown";
  const phaseMap: Record<string, string> = {
    test_drive: "Test Drive",
    professional_launch: "Pro Launch",
    active: "Active",
    expired: "Expired",
  };
  return phaseMap[phase] || phase;
}

function getPhaseBadgeVariant(phase: string): "default" | "secondary" | "destructive" | "outline" {
  switch (phase) {
    case "active":
      return "default";
    case "test_drive":
    case "professional_launch":
      return "secondary";
    case "expired":
      return "destructive";
    default:
      return "outline";
  }
}

export default function Revenue() {
  const { data, isLoading, error } = useQuery<RevenueData>({
    queryKey: ["/api/admin/revenue"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading revenue data...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Failed to load revenue data</div>
      </div>
    );
  }

  const { subscriptions, recentPayments, monthlyRevenue, customers, siteBreakdown } = data;

  const activeCount = Number(subscriptions.active_subscriptions || 0);
  const trialingCount = Number(subscriptions.trialing_subscriptions || 0);
  const expiredCount = Number(subscriptions.canceled_subscriptions || 0);
  const totalForConversion = activeCount + trialingCount + expiredCount;
  const conversionRate = totalForConversion > 0 ? ((activeCount / totalForConversion) * 100).toFixed(1) : "0.0";
  const mrr = Number(subscriptions.monthly_recurring_revenue || 0);
  const totalCustomers = Number(customers.total_customers || 0);

  const planBreakdown = siteBreakdown.reduce((acc, item) => {
    const plan = item.subscription_plan || "unknown";
    acc[plan] = (acc[plan] || 0) + Number(item.count);
    return acc;
  }, {} as Record<string, number>);

  const phaseBreakdown = siteBreakdown.reduce((acc, item) => {
    const phase = item.trial_phase || "unknown";
    acc[phase] = (acc[phase] || 0) + Number(item.count);
    return acc;
  }, {} as Record<string, number>);

  const sortedMonthlyRevenue = [...monthlyRevenue].sort(
    (a, b) => new Date(a.month).getTime() - new Date(b.month).getTime()
  );

  const maxRevenue = Math.max(...sortedMonthlyRevenue.map((m) => Number(m.revenue) || 0), 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-revenue-title">
          Revenue
        </h1>
        <p className="text-muted-foreground">
          Stripe subscription and payment analytics
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Monthly Recurring Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-xl sm:text-2xl font-bold" data-testid="text-mrr">
              {formatCurrency(mrr)}
            </div>
            <p className="text-xs text-muted-foreground">
              From active subscriptions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Active Subscriptions</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-xl sm:text-2xl font-bold" data-testid="text-active-subscriptions">
              {activeCount}
            </div>
            <p className="text-xs text-muted-foreground">
              {trialingCount} trialing, {expiredCount} canceled
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-xl sm:text-2xl font-bold" data-testid="text-total-customers">
              {totalCustomers}
            </div>
            <p className="text-xs text-muted-foreground">
              Stripe customers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-xl sm:text-2xl font-bold" data-testid="text-conversion-rate">
              {conversionRate}%
            </div>
            <p className="text-xs text-muted-foreground">
              Trial to active conversion
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Monthly revenue over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            {sortedMonthlyRevenue.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
                No revenue data available
              </div>
            ) : (
              <div className="space-y-3">
                {sortedMonthlyRevenue.map((month) => {
                  const revenue = Number(month.revenue) || 0;
                  const percentage = (revenue / maxRevenue) * 100;
                  return (
                    <div key={month.month} className="space-y-1" data-testid={`row-month-${month.month}`}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{formatMonth(month.month)}</span>
                        <span className="font-medium">{formatCurrency(revenue)}</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted">
                        <div
                          className="h-2 rounded-full bg-primary transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subscription Breakdown</CardTitle>
            <CardDescription>Sites by plan and trial phase</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="text-sm font-medium mb-3">By Plan</h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(planBreakdown).map(([plan, count]) => (
                  <Badge key={plan} variant="outline" className="text-sm" data-testid={`badge-plan-${plan}`}>
                    {getPlanDisplayName(plan)}: {count}
                  </Badge>
                ))}
                {Object.keys(planBreakdown).length === 0 && (
                  <span className="text-sm text-muted-foreground">No data</span>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-3">By Trial Phase</h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(phaseBreakdown).map(([phase, count]) => (
                  <Badge 
                    key={phase} 
                    variant={getPhaseBadgeVariant(phase)}
                    data-testid={`badge-phase-${phase}`}
                  >
                    {getPhaseDisplayName(phase)}: {count}
                  </Badge>
                ))}
                {Object.keys(phaseBreakdown).length === 0 && (
                  <span className="text-sm text-muted-foreground">No data</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Payments</CardTitle>
          <CardDescription>Latest successful transactions</CardDescription>
        </CardHeader>
        <CardContent>
          {recentPayments.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
              No payments recorded yet
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table data-testid="table-payments">
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">Customer</TableHead>
                    <TableHead className="text-right min-w-[100px]">Amount</TableHead>
                    <TableHead className="min-w-[120px]">Date</TableHead>
                    <TableHead className="min-w-[100px]">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentPayments.map((payment) => (
                    <TableRow key={payment.id} data-testid={`row-payment-${payment.id}`}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{payment.customer_name || "—"}</p>
                          <p className="text-sm text-muted-foreground">{payment.customer_email || "—"}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(payment.amount / 100, payment.currency)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(payment.created)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(payment.status)}>
                          {payment.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
