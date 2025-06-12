
"use client";

import { useState, useEffect, useMemo } from "react";
import type { Note } from "@/types";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { BarChartIcon, PieChartIcon, LineChart as LChartIcon, List, ArrowRight } from "lucide-react"; // Renamed icons to avoid conflict
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, Tooltip, XAxis, YAxis } from 'recharts'; // Keep recharts primitives
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from "@/components/ui/chart"; // Import shadcn chart components
import { format, startOfMonth, endOfMonth, eachDayOfInterval, parseISO } from 'date-fns';
import { faIR } from 'date-fns/locale/fa-IR';
import { format as formatJalali } from 'date-fns-jalali';


const MAX_RECENT_NOTES = 5;

const aggregateData = (notes: Note[], groupBy: keyof Note | 'day' | 'category', dateRange?: {start: Date, end: Date}) => {
  const aggregation: { [key: string]: number } = {};

  let filteredNotes = notes;
  if (dateRange && groupBy === 'day') {
    filteredNotes = notes.filter(note => {
      const noteDate = new Date(note.createdAt);
      return noteDate >= dateRange.start && noteDate <= dateRange.end;
    });
  }

  filteredNotes.forEach(note => {
    if (groupBy === 'day' && dateRange) {
      const dayKey = formatJalali(new Date(note.createdAt), 'yyyy-MM-dd'); // Use ISO format for internal key to ensure correct sorting
      aggregation[dayKey] = (aggregation[dayKey] || 0) + 1;
    } else if (groupBy === 'category') {
      note.categories.forEach(category => {
        aggregation[category] = (aggregation[category] || 0) + 1;
      });
    } else if (groupBy !== 'day' && note[groupBy as keyof Note]) {
      const key = String(note[groupBy as keyof Note]);
      if (key.trim() !== "") { // Ensure province is not empty
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
  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedNotes = localStorage.getItem("not_notes");
      if (storedNotes) {
        setNotes(JSON.parse(storedNotes).map((note: any) => ({
          ...note,
          categories: Array.isArray(note.categories) ? note.categories : (typeof note.categories === 'string' ? note.categories.split(',').map((s:string) => s.trim()).filter(Boolean) : []),
          tags: Array.isArray(note.tags) ? note.tags : (typeof note.tags === 'string' ? note.tags.split(',').map((s:string) => s.trim()).filter(Boolean) : []),
          province: note.province || "", 
          phoneNumbers: Array.isArray(note.phoneNumbers) ? note.phoneNumbers : (typeof note.phoneNumbers === 'string' ? note.phoneNumbers.split(',').map((s:string) => s.trim()).filter(Boolean) : []),
          isArchived: typeof note.isArchived === 'boolean' ? note.isArchived : false,
          isPublished: typeof note.isPublished === 'boolean' ? note.isPublished : false,
          createdAt: parseISO(note.createdAt),
          updatedAt: parseISO(note.updatedAt),
        })));
      }
    } catch (error) {
      console.error("Failed to load notes from localStorage for dashboard", error);
      toast({
        title: "خطا",
        description: "بارگذاری یادداشت‌ها برای داشبورد ممکن نبود.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const recentNotes = useMemo(() => {
    return [...notes]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, MAX_RECENT_NOTES);
  }, [notes]);

  const notesByDayData = useMemo(() => {
    const today = new Date();
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);
    const rawData = aggregateData(notes, 'day', { start: monthStart, end: monthEnd });
    return rawData.map(item => ({
      name: formatJalali(parseISO(item.name), 'dd'), // Day number for XAxis label
      originalDate: item.name, // Keep original date for tooltip
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

  const provinceChartConfig = {
    // Dynamic keys based on province names, so use a generic config or rely on cell colors
    // For legend and tooltip to work well with shadcn components, 
    // it's better if 'notesByProvinceData' items have a consistent key like 'count' or 'value'.
    // 'value' is already used.
    // Let's assume 'name' (province name) will be used directly for labels.
  } satisfies ChartConfig;
  
  const categoryChartConfig = {
    value: { label: "تعداد یادداشت" }, // For legend, referring to 'value' dataKey in Bar
  } satisfies ChartConfig;

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
            <CardDescription>تعداد یادداشت‌های ایجاد شده در هر روز از ماه جاری</CardDescription>
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
                           return `روز ${formatJalali(parseISO(payload[0].payload.originalDate), 'do MMMM')}`;
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
                  content={<ChartTooltipContent hideLabel />} // hideLabel because Pie nameKey is better
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
                    // Use YAxis dataKey 'name' (category name) as the label for tooltip
                    labelFormatter={(_, payload) => {
                        if (payload && payload.length > 0) return payload[0].payload.name;
                        return '';
                    }}
                  />} 
                />
                <Legend content={<ChartLegendContent />} /> {/* Legend refers to 'value' from config */}
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
                  <p className="text-xs text-muted-foreground">
                    آخرین بروزرسانی: {formatJalali(new Date(note.updatedAt), 'PPPp', { locale: faIR })}
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

    