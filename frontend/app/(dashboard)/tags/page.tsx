"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tagApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function TagsPage() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [newTagName, setNewTagName] = useState("");

  const { data: tags, isLoading } = useQuery({
    queryKey: ["tags"],
    queryFn: () => tagApi.getTags(),
    enabled: isAuthenticated,
  });

  const createMutation = useMutation({
    mutationFn: (name: string) => tagApi.createTag({ name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      setNewTagName("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => tagApi.deleteTag(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    },
  });

  const handleCreate = () => {
    if (!newTagName.trim()) return;
    createMutation.mutate(newTagName.trim());
  };

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Tags</h2>
        <p className="text-gray-600 mt-1">
          Manage your task tags
        </p>
      </div>

      {/* Create Tag */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Tag</h3>
        <div className="flex gap-3">
          <input
            type="text"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleCreate();
              }
            }}
            placeholder="Enter tag name"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={handleCreate}
            disabled={createMutation.isPending || !newTagName.trim()}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createMutation.isPending ? "Adding..." : "Add Tag"}
          </button>
        </div>
      </div>

      {/* Tag List */}
      <div className="bg-white rounded-lg shadow">
        {isLoading ? (
          <div className="p-8 text-center text-gray-600">Loading tags...</div>
        ) : tags && tags.length > 0 ? (
          <div className="p-6">
            <div className="flex flex-wrap gap-3">
              {tags.map((tag) => (
                <div
                  key={tag.id}
                  className="group flex items-center gap-2 px-4 py-2 bg-purple-50 border border-purple-200 rounded-full hover:bg-purple-100 transition-colors"
                >
                  <span className="text-purple-700 font-medium">#{tag.name}</span>
                  <span className="text-xs text-purple-500">
                    {new Date(tag.created_at).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => {
                      if (confirm(`Delete tag "#${tag.name}"? It will be removed from all tasks.`)) {
                        deleteMutation.mutate(tag.id);
                      }
                    }}
                    disabled={deleteMutation.isPending}
                    className="ml-1 w-5 h-5 flex items-center justify-center text-purple-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete tag"
                  >
                    x
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-gray-600 text-lg">No tags yet</p>
            <p className="text-gray-500 text-sm mt-1">Create your first tag above to label your tasks!</p>
          </div>
        )}
      </div>
    </main>
  );
}
