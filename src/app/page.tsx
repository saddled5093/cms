
"use client";

import { useState, useEffect, useMemo } from "react";
import type { Note, Category } from "@/types"; // Using updated types
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { BarChartIcon, PieChartIcon, LineChart as LChartIcon, List, ArrowRight, CalendarDays } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from "@/components/ui/chart";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, parseISO, isValid } from 'date-fns';
import { faIR } from 'date-fns/locale/fa-IR';
import { format as formatJalali } from 'date-fns-jalali';


const MAX_RECENT_NOTES = 5;

// This function now expects categories to be an array of objects { id, name }
const aggregateData = (notes: Note[], groupBy: 'day' | 'province' | 'category', dateRange?: {start: Date, end: Date}) => {
  const aggregation: { [key: string]: number } = {};

  let filteredNotes = notes;
  if (dateRange && groupBy === 'day') {
    filteredNotes = notes.filter(note => {
      const noteEventDate = new Date(note.eventDate);
      return noteEventDate >= dateRange.start && noteEventDate <= dateRange.end;
    });
  }

  filteredNotes.forEach(note => {
    if (groupBy === 'day' && dateRange) {
      const dayKey = formatJalali(new Date(note.eventDate), 'yyyy-MM-dd');
      aggregation[dayKey] = (aggregation[dayKey] || 0) + 1;
    } else if (groupBy === 'category') {
      note.categories.forEach(category => { // category is { id, name }
        aggregation[category.name] = (aggregation[category.name] || 0) + 1;
      });
    } else if (groupBy === 'province' && note.province) {
      const key = String(note.province);
      if (key.trim() !== "") { 
         aggregation[key] = (aggregation[key] || 0) + 1;
      }
    }
  });

  if (groupBy === 'day' && dateRange) {
    const allDaysInMonth = eachDayOfInterval({ start: dateRange.start, end: dateRange.end });
    allDaysInMonth.forEach(day => {
      const dayKey = formatJalali(day, 'yyyy-MM-dd');
      if (!aggregation[dayKey]) {
        aggregation[dayKey] = 0;
      }
    });
  }
  
  return Object.entries(aggregation)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => groupBy === 'day' ? a.name.localeCompare(b.name) : b.value - a.value);
};


export default function DashboardPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        // Fetch notes from the API
        // const response = await fetch('/api/notes'); // Or a dedicated dashboard API endpoint
        // if (!response.ok) {
        //   throw new Error('Failed to fetch notes for dashboard');
        // }
        // let fetchedNotes: Note[] = await response.json();
        const fetchedNotes: Note[] = []; // Placeholder until API is connected

        // Normalize dates
        const processedNotes = fetchedNotes.map((note: any) => {
           let eventDate = note.eventDate ? parseISO(note.eventDate) : (note.createdAt ? parseISO(note.createdAt) : new Date());
           if (!isValid(eventDate)) eventDate = new Date();
           let createdAt = note.createdAt ? parseISO(note.createdAt) : new Date();
           if (!isValid(createdAt)) createdAt = new Date();
           let updatedAt = note.updatedAt ? parseISO(note.updatedAt) : new Date();
           if (!isValid(updatedAt)) updatedAt = new Date();

           return {
            ...note,
            // Ensure categories is an array of objects {id, name}
            categories: Array.isArray(note.categories) ? note.categories.map((c: any) => typeof c === 'string' ? {id: c, name: c} : c) : [],
            tags: Array.isArray(note.tags) ? note.tags : (typeof note.tags === 'string' ? note.tags.split(',').map((s:string) => s.trim()).filter(Boolean) : []),
            province: note.province || "", 
            phoneNumbers: Array.isArray(note.phoneNumbers) ? note.phoneNumbers : (typeof note.phoneNumbers === 'string' ? note.phoneNumbers.split(',').map((s:string) => s.trim()).filter(Boolean) : []),
            isArchived: typeof note.isArchived === 'boolean' ? note.isArchived : false,
            isPublished: typeof note.isPublished === 'boolean' ? note.isPublished : false,
            eventDate,
            createdAt,
            updatedAt,
          }
        });
        setNotes(processedNotes);

      } catch (error) {
        console.error("Failed to load notes for dashboard from API", error);
        toast({
          title: "خطا",
          description: "بارگذاری یادداشت‌ها برای داشبورد از سرور ممکن نبود.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardData();
  }, [toast]);

  const recentNotes = useMemo(() => {
    return [...notes]
      .sort((a, b) => new Date(b.updatedAt as string).getTime() - new Date(a.updatedAt as string).getTime())
      .slice(0, MAX_RECENT_NOTES);
  }, [notes]);

  const notesByDayData = useMemo(() => {
    const today = new Date();
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);
    const rawData = aggregateData(notes, 'day', { start: monthStart, end: monthEnd });
    return rawData.map(item => ({
      name: formatJalali(parseISO(item.name), 'dd'), 
      originalDate: item.name, 
      value: item.value
    }));
  }, [notes]);
  
  const notesByProvinceData = useMemo(() => aggregateData(notes, 'province').filter(p => p.name), [notes]);
  const notesByCategoryData = useMemo(() => aggregateData(notes, 'category').filter(c => c.name), [notes]);
  
  const CHART_COLORS = [
    'hsl(var(--chart-1))', 
    'hsl(var(--chart-2))', 
    'hsl(var(--chart-3))', 
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))'
  ];

  const dailyChartConfig = {
    value: { label: "تعداد یادداشت", color: "hsl(var(--primary))" },
  } satisfies ChartConfig;

  const provinceChartConfig = {} satisfies ChartConfig; // Colors handled by Cell
  
  const categoryChartConfig = {
    // value: { label: "تعداد یادداشت" }, // Not needed if colors are per-bar
  } satisfies ChartConfig; // Colors handled by Cell


  if (isLoading) {
    return <div className="container mx-auto p-4 md:p-8 text-center">در حال بارگذاری اطلاعات داشبورد...</div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-headline text-primary">داشبورد</h1>
        <Button asChild variant="outline">
          <Link href="/notes">
            مشاهده همه یادداشت‌ها
            <ArrowRight className="mr-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-lg rounded-lg">
          <CardHeader>
            <CardTitle className="text-lg font-headline text-primary flex items-center">
              <LChartIcon className="ml-2 h-5 w-5" />
              یادداشت‌های ماه جاری (روزانه)
            </CardTitle>
            <CardDescription>تعداد یادداشت‌های ایجاد شده (بر اساس تاریخ رویداد) در هر روز از ماه جاری</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {notesByDayData.length > 0 ? (
              <ChartContainer config={dailyChartConfig} className="w-full h-full">
                <LineChart data={notesByDayData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }} accessibilityLayer>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--foreground))" tickFormatter={(tick) => `${tick}ام`} />
                  <YAxis stroke="hsl(var(--foreground))" allowDecimals={false}/>
                  <ChartTooltip
                    cursor={true}
                    content={<ChartTooltipContent 
                      indicator="line" 
                      labelFormatter={(_, payload) => {
                        if (payload && payload.length > 0 && payload[0].payload.originalDate) {
                           return `روز ${formatJalali(parseISO(payload[0].payload.originalDate), 'do MMMM', { locale: faIR })}`;
                        }
                        return '';
                      }}
                    />}
                  />
                  <Legend content={<ChartLegendContent />} />
                  <Line dataKey="value" type="monotone" stroke="var(--color-value)" strokeWidth={2} dot={{ fill: 'var(--color-value)' }} activeDot={{ r: 6, stroke: 'hsl(var(--background))', fill: 'var(--color-value)' }} name="تعداد یادداشت" />
                </LineChart>
              </ChartContainer>
            ) : (
               <p className="text-muted-foreground text-center pt-10">داده‌ای برای نمایش وجود ندارد.</p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-lg rounded-lg">
          <CardHeader>
            <CardTitle className="text-lg font-headline text-primary flex items-center">
              <PieChartIcon className="ml-2 h-5 w-5" />
              یادداشت‌ها بر اساس استان
            </CardTitle>
            <CardDescription>پراکندگی یادداشت‌ها در استان‌های مختلف</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
           {notesByProvinceData.length > 0 ? (
            <ChartContainer config={provinceChartConfig} className="w-full h-full">
              <PieChart>
                <ChartTooltip 
                  cursor={false} 
                  content={<ChartTooltipContent hideLabel />} 
                />
                <Pie data={notesByProvinceData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} labelLine={false}
                  label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }) => {
                    const RADIAN = Math.PI / 180;
                    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                    const y = cy + radius * Math.sin(-midAngle * RADIAN);
                    return (percent * 100) > 5 ? (
                      <text x={x} y={y} fill="hsl(var(--card-foreground))" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize="10px">
                        {`${name} (${(percent * 100).toFixed(0)}%)`}
                      </text>
                    ) : null;
                  }}
                >
                  {notesByProvinceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} stroke="hsl(var(--card))" />
                  ))}
                </Pie>
                <Legend content={<ChartLegendContent nameKey="name" />} />
              </PieChart>
            </ChartContainer>
            ) : (
               <p className="text-muted-foreground text-center pt-10">داده‌ای برای نمایش وجود ندارد.</p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-lg rounded-lg">
          <CardHeader>
            <CardTitle className="text-lg font-headline text-primary flex items-center">
              <BarChartIcon className="ml-2 h-5 w-5" />
              یادداشت‌ها بر اساس دسته‌بندی
            </CardTitle>
            <CardDescription>تعداد یادداشت‌ها در هر دسته‌بندی (۵ دسته‌بندی برتر)</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {notesByCategoryData.slice(0, 5).length > 0 ? (
            <ChartContainer config={categoryChartConfig} className="w-full h-full">
              <BarChart data={notesByCategoryData.slice(0, 5)} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }} accessibilityLayer>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--foreground))" allowDecimals={false} />
                <YAxis dataKey="name" type="category" stroke="hsl(var(--foreground))" width={80} tick={{fontSize: 10}}/>
                <ChartTooltip 
                  cursor={false} 
                  content={<ChartTooltipContent 
                    labelFormatter={(_, payload) => {
                        if (payload && payload.length > 0) return payload[0].payload.name;
                        return '';
                    }}
                    formatter={(value, name) => [value, name]} // To show "Name: Value"
                  />} 
                />
                {/* <Legend content={<ChartLegendContent />} />  Legend might be redundant for vertical bar with labels */}
                <Bar dataKey="value" name="تعداد یادداشت" barSize={20} radius={4}>
                   {notesByCategoryData.slice(0,5).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
            ) : (
               <p className="text-muted-foreground text-center pt-10">داده‌ای برای نمایش وجود ندارد.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg rounded-lg">
        <CardHeader>
          <CardTitle className="text-xl font-headline text-primary flex items-center">
            <List className="ml-2 h-5 w-5" />
            یادداشت‌های اخیر
          </CardTitle>
          <CardDescription>نگاهی سریع به آخرین یادداشت‌های بروزرسانی شده شما.</CardDescription>
        </CardHeader>
        <CardContent>
          {recentNotes.length > 0 ? (
            <div className="space-y-3">
              {recentNotes.map((note) => (
                <Link href={`/notes?noteId=${note.id}`} key={note.id} className="block hover:bg-muted/30 p-3 rounded-md transition-colors">
                  <h3 className="font-semibold text-foreground">{note.title}</h3>
                   <div className="flex items-center text-xs text-muted-foreground mt-1">
                        <CalendarDays className="ml-1.5 h-3.5 w-3.5" />
                        <span>تاریخ رویداد: {note.eventDate ? formatJalali(new Date(note.eventDate), "PPP", { locale: faIR }) : 'ثبت نشده'}</span>
                   </div>
                  <p className="text-xs text-muted-foreground">
                    آخرین بروزرسانی: {formatJalali(new Date(note.updatedAt as string), 'PPPp', { locale: faIR })}
                  </p>
                  <p className="text-sm text-foreground/80 mt-1 truncate">
                    {note.content.substring(0,100)}{note.content.length > 100 ? '...' : ''}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-6">هنوز یادداشتی ایجاد نشده است.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
