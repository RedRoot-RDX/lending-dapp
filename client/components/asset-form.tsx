"use client";
/* ------------------ Imports ----------------- */
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItemWithInline,
  SelectTrigger,
  SelectValue,
} from "@/components/select-with-inline";
import { zodResolver } from "@hookform/resolvers/zod";

import { assetConfigs, AssetName } from "@/types/asset";
import { useEffect } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { InputIB } from "./input-inline-button";
import { Comobobox } from "./combobox";

/* ----------------- Constants ---------------- */
// Form
const VALUE_REGEX = /^[+-]?(\d*\.)?\d+$/;

const AssetNames = Object.keys(assetConfigs) as AssetName[];
const zAssetEnum = z.enum(AssetNames as [AssetName, ...AssetName[]]);
const assetFormSchema = z.object({
  assets: z.array(
    z.object({
      asset: zAssetEnum,
      value: z.string().min(1, "Amount cannot be empty").regex(VALUE_REGEX, "Invalid number entered"),
    }),
  ),
});

type AssetEntry = z.infer<typeof assetFormSchema>["assets"][number];
const defaultAssets: AssetEntry[] = [];

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

    if (assetsWatch.assets.length == AssetNames.length) {
      return;
    }
    append({
      asset: AssetNames.filter((asset) => !assetsWatch.assets.map((asset) => asset.asset).includes(asset))[0],
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full flex flex-col gap-2">
        {fields.map((field, i) => (
          <div key={field.id} className="w-full flex flex-row gap-2">
            {/* ---------------- Select Box ---------------- */}
            <FormField
              control={form.control}
              name={`assets.${i}.asset`}
              render={({ field }) => (
                <FormItem>
                  <Comobobox
                    selection={AssetNames.map((asset) => ({ value: asset, label: asset }))}
                    value={field.value}
                    onValueChange={(value) => {
                      const selectedAssets = form.getValues("assets").map((assetRecord) => assetRecord.asset as string);
                      console.log(value, selectedAssets, selectedAssets.includes(value));
                      field.onChange(value);
                    }}
                    selectLabel="Select Label"
                    searchLabel="Search Label"
                    invalidSearchLabel="Invalid Search"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* ---------------- Value Input --------------- */}
            <FormField
              name={`assets.${i}.value`}
              control={form.control}
              render={({ field }) => {
                return (
                  <FormItem className="w-full">
                    <FormControl>
                      <InputIB
                        className=""
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
            {/* --------------- Remove Button -------------- */}
            <Button variant="outline" onClick={(e) => removeAsset(e, i)}>
              Remove
            </Button>
          </div>
        ))}
        {/* ---------------- Add Button ---------------- */}
        <div className="w-full flex flex-row gap-2 justify-center">
          <Button variant="outline" onClick={addAsset}>
            Add Collateral
          </Button>
        </div>
      </form>
    </Form>
  );
}
