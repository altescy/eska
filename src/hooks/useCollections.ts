import { useAtom } from "jotai";
import React from "react";
import { collectionsAtom } from "@/atoms/collections";
import type { Collection } from "@/types/collection";

export const useCollections = () => {
  const [collections, setCollections] = useAtom(collectionsAtom);
  const [isSaved, setIsSaved] = React.useState(false);

  const save = React.useCallback(
    (collection: Collection) => {
      setCollections((prev) => {
        const finalize = () => {
          setIsSaved(true);
          setTimeout(() => setIsSaved(false), 2000);
        };
        const index = prev.findIndex((col) => col.id === collection.id);
        if (index !== -1) {
          const updated = [...prev];
          updated[index] = collection;
          finalize();
          return updated;
        }
        finalize();
        return [...prev, collection];
      });
    },
    [setCollections],
  );

  const remove = React.useCallback(
    (id: string) => {
      setCollections((prev) => prev.filter((col) => col.id !== id));
    },
    [setCollections],
  );

  const search = React.useCallback(
    (query: string) => {
      return collections.filter((collection) => collection.name.toLowerCase().includes(query.toLowerCase()));
    },
    [collections],
  );

  const contains = React.useCallback(
    (id: string) => {
      return collections.some((col) => col.id === id);
    },
    [collections],
  );

  return {
    collections,
    save,
    remove,
    search,
    contains,
    isSaved,
    setIsSaved,
  };
};
