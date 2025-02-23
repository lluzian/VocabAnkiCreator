import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { insertFlashcardSchema } from "@shared/schema";
import type { InsertFlashcard, Flashcard } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { downloadCsv } from "@/lib/csv";
import { Plus, Download, Trash2, RefreshCw } from "lucide-react";

export default function Home() {
  const { toast } = useToast();
  const [selectedCard, setSelectedCard] = useState<number | null>(null);

  const form = useForm<InsertFlashcard>({
    resolver: zodResolver(insertFlashcardSchema),
    defaultValues: {
      word: "",
      context: "",
    },
  });

  const { data: flashcards = [] } = useQuery<Flashcard[]>({
    queryKey: ["/api/flashcards"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertFlashcard) => {
      const res = await apiRequest("POST", "/api/flashcards", data);
      return res.json();
    },
    onSuccess: () => {
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/flashcards"] });
      toast({
        title: "Word added successfully",
        description: "Your word has been saved",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add word",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const generateMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/flashcards/${id}/generate`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/flashcards"] });
      toast({
        title: "AI content generated",
        description: "Flashcard content has been enhanced with AI",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Generation failed",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setSelectedCard(null);
    },
  });

  const clearMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", "/api/flashcards");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/flashcards"] });
      toast({
        title: "Flashcards cleared",
        description: "All flashcards have been deleted",
      });
    },
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Vocabulary Flashcard Creator
          </h1>
          <p className="mt-2 text-muted-foreground">
            Add words you encounter and let AI help create comprehensive flashcards
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit((data) => createMutation.mutate(data))}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="word"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Word</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter a word or phrase" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="context"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Context (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add context where you encountered this word"
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full"
                  disabled={createMutation.isPending}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Word
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold">Your Flashcards</h2>
          <div className="space-x-2">
            <Button
              variant="outline"
              onClick={() => downloadCsv(flashcards)}
              disabled={flashcards.length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              Export to Anki
            </Button>
            <Button
              variant="destructive"
              onClick={() => clearMutation.mutate()}
              disabled={flashcards.length === 0}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All
            </Button>
          </div>
        </div>

        <div className="grid gap-4">
          {flashcards.map((flashcard) => (
            <Card key={flashcard.id}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-semibold">{flashcard.word}</h3>
                    {flashcard.context && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Context: {flashcard.context}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedCard(flashcard.id);
                      generateMutation.mutate(flashcard.id);
                    }}
                    disabled={
                      generateMutation.isPending &&
                      selectedCard === flashcard.id
                    }
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    {flashcard.aiContent ? "Regenerate" : "Generate"}
                  </Button>
                </div>

                {flashcard.aiContent && (
                  <div className="mt-4 space-y-2">
                    <p>
                      <strong>Definition:</strong>{" "}
                      {flashcard.aiContent.definition}
                    </p>
                    <p>
                      <strong>Example:</strong> {flashcard.aiContent.example}
                    </p>
                    <p>
                      <strong>Synonyms:</strong>{" "}
                      {flashcard.aiContent.synonyms.join(", ")}
                    </p>
                    <p>
                      <strong>Mnemonic:</strong> {flashcard.aiContent.mnemonic}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}