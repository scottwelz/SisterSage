"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { Product } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import React, { useState } from 'react';
import { ShoppingBag, CreditCard } from 'lucide-react';

const formSchema = z.object({
  shopify: z.coerce.number().int().min(0, "Stock can't be negative."),
  square: z.coerce.number().int().min(0, "Stock can't be negative."),
});

interface ManualAdjustDialogProps {
  product: Product;
  onStockUpdate: (
    productId: string,
    newStock: { shopify: number; square: number }
  ) => void;
  children: React.ReactNode;
}

export function ManualAdjustDialog({
  product,
  onStockUpdate,
  children,
}: ManualAdjustDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      shopify: product.stock.shopify,
      square: product.stock.square,
    },
  });

  React.useEffect(() => {
    if (isOpen) {
      form.reset({
        shopify: product.stock.shopify,
        square: product.stock.square,
      });
    }
  }, [isOpen, form, product.stock]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    onStockUpdate(product.id, {
      shopify: values.shopify,
      square: values.square,
    });
    toast({
      title: 'Inventory Updated',
      description: `${product.name} stock levels have been adjusted.`,
    });
    setIsOpen(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">Adjust Stock for {product.name}</DialogTitle>
          <DialogDescription>
            Manually set the inventory levels for each platform.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="shopify"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                    Shopify Stock
                  </FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="square"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    Pike Place (Square) Stock
                  </FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" variant="accent">Save Changes</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
