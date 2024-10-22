"use client";
/* ------------------ Imports ----------------- */
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";

import { Assets } from "@/lib/utils";
import { useEffect } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { InputIB } from "./input-inline-button";
import { SelectItemWithInfo } from "./select-item-info";

/* ----------------- Constants ---------------- */
// Form
const VALUE_REGEX = /^[+-]?(\d*\.)?\d+$/;

const zAssetEnum = z.enum(Assets);
const assetFormSchema = z.object({
  assets: z.array(
    z.object({
      asset: zAssetEnum,
      value: z.string().min(1, "Amount cannot be empty").regex(VALUE_REGEX, "Invalid number entered"),
    }),
  ),
});

type AssetEntry = z.infer<typeof assetFormSchema>["assets"][number];
const defaultAssets: AssetEntry[] = [
  {
    asset: "XRD",
    value: "0.0",
  },
];

export function AssetForm() {
  /* ---------------- Input Form ---------------- */
  const form = useForm<z.infer<typeof assetFormSchema>>({
    resolver: zodResolver(assetFormSchema),
    defaultValues: { assets: defaultAssets },
    mode: "onChange",
  });
  const assetsWatch = form.watch();

  function onSubmit(values: z.infer<typeof assetFormSchema>) {
    console.log("onSubmit", values);
  }

  const { fields, append, remove } = useFieldArray({
    name: "assets",
    control: form.control,
  });

  function addAsset(e: any) {
    e.preventDefault();

    if (assetsWatch.assets.length == Assets.length) {
      return;
    }
    append({
      asset: Assets.filter((asset) => !assetsWatch.assets.map((asset) => asset.asset).includes(asset))[0],
      value: "0.0",
    });
  }

  function removeAsset(e: any, i: number) {
    e.preventDefault();

    if (assetsWatch.assets.length == 1) {
      return;
    }
    remove(i);
  }

  useEffect(() => {
    console.log(`Form asset data:\n${JSON.stringify(assetsWatch.assets, null, 2)}`);
  }, [assetsWatch]);

  /* ----------------- Component ---------------- */
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-fit flex flex-col gap-2">
        {fields.map((field, i) => (
          <div key={field.id} className="flex flex-row gap-2">
            {/*
            ---------------- Select Box ----------------
            */}
            <FormField
              control={form.control}
              name={`assets.${i}.asset`}
              render={({ field }) => (
                <FormItem>
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      const selectedAssets = form.getValues("assets").map((assetRecord) => assetRecord.asset as string);
                      console.log(value, selectedAssets, selectedAssets.includes(value));
                      field.onChange(value);
                    }}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue placeholder="Select Asset" />
                    </SelectTrigger>
                    <SelectContent className="grid grid-cols-2">
                      {Assets.filter(
                        (asset) =>
                          asset == field.value || !assetsWatch.assets.map((asset) => asset.asset).includes(asset),
                      ).map((asset, i) => (
                        <SelectItemWithInfo key={i} value={asset}>
                          {asset}
                        </SelectItemWithInfo>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/*
            ---------------- Value Input ---------------
            */}
            <FormField
              name={`assets.${i}.value`}
              control={form.control}
              render={({ field }) => {
                return (
                  <FormItem>
                    <FormControl>
                      <InputIB
                        className="w-48"
                        placeholder={`Enter amount of ${assetsWatch.assets[i].asset}`}
                        {...field}
                        value={field.value}
                        onChange={field.onChange}
                        buttonText="Max"
                        onClick={() => {
                          alert(`Clicked ${assetsWatch.assets[i].asset}: ${assetsWatch.assets[i].value}`);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
            {/*
            --------------- Remove Button --------------
            */}
            <Button onClick={(e) => removeAsset(e, i)}> - </Button>
          </div>
        ))}
        {/*
        ---------------- Add Button ----------------
         */}
        <div className="w-full flex flex-row gap-2 justify-center">
          <Button onClick={addAsset}>Add Collateral</Button>
        </div>
      </form>
    </Form>
  );
}
