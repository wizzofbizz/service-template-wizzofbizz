import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, Plus, X } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface LandingPageSection {
  id: string;
  section: string;
  elementKey: string;
  contentType: string;
  value: string | null;
  altText: string | null;
  url: string | null;
  displayOrder: number;
  isActive: boolean;
}

export default function WebsiteEditorPage() {
  const pageStyle = { fontFamily: 'var(--font-sans)' };
  const { user } = useAuth();
  const { toast } = useToast();
  const [editingSection, setEditingSection] = useState<LandingPageSection | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const businessId = user?.businessId;

  // Fetch business data to get the slug for preview
  const { data: business } = useQuery<{ slug: string }>({
    queryKey: [`/api/businesses/${businessId}`],
    enabled: !!businessId,
  });

  const { data: sections = [], isLoading } = useQuery<LandingPageSection[]>({
    queryKey: [`/api/businesses/${businessId}/landing-page-sections`],
    enabled: !!businessId,
  });

  const updateMutation = useMutation({
    mutationFn: async (updatedSection: LandingPageSection) => {
      if (!editingSection || !businessId) return;
      const response = await apiRequest(
        "PUT",
        `/api/businesses/${businessId}/landing-page-sections/${updatedSection.id}`,
        {
          section: updatedSection.section,
          elementKey: updatedSection.elementKey,
          contentType: updatedSection.contentType,
          value: updatedSection.value,
          altText: updatedSection.altText,
          url: updatedSection.url,
          displayOrder: updatedSection.displayOrder,
          isActive: updatedSection.isActive,
        }
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Section updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/businesses/${businessId}/landing-page-sections`] });
      setEditingSection(null);
      setRefreshKey(prev => prev + 1);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update section",
        variant: "destructive",
      });
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: { section: string; elementKey: string; contentType: string; value: string; displayOrder: number }) => {
      if (!businessId) return;
      const response = await apiRequest(
        "POST",
        `/api/businesses/${businessId}/landing-page-sections`,
        payload
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "New item added successfully",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/businesses/${businessId}/landing-page-sections`] });
      setRefreshKey(prev => prev + 1);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add new item",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (payload: { section: string; itemNumber: number }) => {
      if (!businessId) return;
      const response = await apiRequest(
        "DELETE",
        `/api/businesses/${businessId}/landing-page-sections/${payload.section}/${payload.itemNumber}`,
        {}
      );
      return response.json();
    },
    onSuccess: async () => {
      toast({ title: "Success", description: "Item deleted successfully" });
      // Wait for query to refetch completely before clearing UI state
      await queryClient.refetchQueries({ queryKey: [`/api/businesses/${businessId}/landing-page-sections`] });
      setEditingSection(null);
      setRefreshKey(prev => prev + 1);
    },
    onError: (error: any) => {
      console.error("Delete error:", error);
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive",
      });
    },
  });

  const getMaxItemNumber = (sectionName: string, itemType: string) => {
    const itemRegex = new RegExp(`^item_(\\d+)_${itemType}$`);
    const numbers = (groupedSections[sectionName] || [])
      .map(item => {
        const match = item.elementKey.match(itemRegex);
        return match ? parseInt(match[1]) : 0;
      })
      .filter(num => num > 0);
    return numbers.length > 0 ? Math.max(...numbers) : 0;
  };

  const handleAddItem = (sectionName: string) => {
    if (sectionName === 'services') {
      const nextNum = getMaxItemNumber('services', 'heading') + 1;
      const baseOrder = (groupedSections['services'] || []).length + 1;
      createMutation.mutate({ section: 'services', elementKey: `item_${nextNum}_heading`, contentType: 'text', value: '', displayOrder: baseOrder });
      createMutation.mutate({ section: 'services', elementKey: `item_${nextNum}_description`, contentType: 'text', value: '', displayOrder: baseOrder + 1 });
    } else if (sectionName === 'testimonials') {
      const nextNum = getMaxItemNumber('testimonials', 'text') + 1;
      const baseOrder = (groupedSections['testimonials'] || []).length + 1;
      createMutation.mutate({ section: 'testimonials', elementKey: `item_${nextNum}_text`, contentType: 'text', value: '', displayOrder: baseOrder });
      createMutation.mutate({ section: 'testimonials', elementKey: `item_${nextNum}_author`, contentType: 'text', value: '', displayOrder: baseOrder + 1 });
    } else if (sectionName === 'gallery') {
      const galleryItems = (groupedSections['gallery'] || []).filter(item => item.elementKey.includes('image_')).length;
      if (galleryItems < 10) {
        const nextNum = galleryItems + 1;
        const baseOrder = (groupedSections['gallery'] || []).length + 1;
        createMutation.mutate({ section: 'gallery', elementKey: `image_${nextNum}`, contentType: 'image', value: '', displayOrder: baseOrder });
      }
    }
  };

  const handleDeleteItem = (sectionName: string, elementKey: string) => {
    // Extract item number from elementKey (e.g., "item_1_text" -> 1, "image_1" -> 1)
    let itemNumber: number | null = null;

    if (sectionName === 'services' || sectionName === 'testimonials') {
      const match = elementKey.match(/^item_(\d+)_/);
      if (match) itemNumber = parseInt(match[1]);
    } else if (sectionName === 'gallery') {
      const match = elementKey.match(/^image_(\d+)$/);
      if (match) itemNumber = parseInt(match[1]);
    }

    if (itemNumber !== null) {
      deleteMutation.mutate({ section: sectionName, itemNumber });
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, sectionId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Error", description: "Image must be less than 5MB", variant: "destructive" });
      return;
    }

    setUploadingId(sectionId);
    try {
      // Step 1: Get presigned upload URL from server
      const urlResponse = await fetch(`/api/businesses/${businessId}/upload-image-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!urlResponse.ok) throw new Error('Failed to get upload URL');
      const { uploadURL } = await urlResponse.json();

      // Step 2: Upload file directly to Google Cloud Storage
      const uploadResponse = await fetch(uploadURL, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResponse.ok) throw new Error('Upload failed');

      // Step 3: Finalize and get normalized path
      const finalizeResponse = await fetch(`/api/businesses/${businessId}/image-uploaded`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageURL: uploadURL }),
      });

      if (!finalizeResponse.ok) throw new Error('Failed to finalize upload');
      const { url } = await finalizeResponse.json();

      if (editingSection) {
        updateMutation.mutate({ ...editingSection, value: url });
      }
      toast({ title: "Success", description: "Image uploaded successfully" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to upload image", variant: "destructive" });
    } finally {
      setUploadingId(null);
    }
  };

  const groupedSections = sections.reduce((acc, section) => {
    if (!acc[section.section]) {
      acc[section.section] = [];
    }
    acc[section.section].push(section);
    return acc;
  }, {} as Record<string, LandingPageSection[]>);

  // Define section order to match page layout
  const sectionOrder = ['hero', 'about', 'services', 'testimonials', 'gallery', 'contact'];
  const orderedSections = sectionOrder
    .map(sectionName => [sectionName, groupedSections[sectionName]] as const)
    .filter(([, sectionItems]) => sectionItems !== undefined);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6" style={pageStyle}>
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Website Editor</h1>
          <p className="text-muted-foreground mt-2">Customize your landing page sections</p>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowPreview(!showPreview)}
          className="flex gap-2"
        >
          <Eye className="h-4 w-4" />
          {showPreview ? "Hide" : "Show"} Preview
        </Button>
      </div>

      <div className={`grid gap-6 ${showPreview ? "grid-cols-2" : "grid-cols-1"}`}>
        {/* Editor Panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Edit Sections</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible defaultValue="hero" className="w-full">
                {orderedSections.map(([sectionName, sectionItems]) => (
                  <AccordionItem key={sectionName} value={sectionName}>
                    <AccordionTrigger className="capitalize font-semibold flex justify-between items-center gap-2">
                      <span>{sectionName}</span>
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        {(sectionName === 'services' || sectionName === 'testimonials' || (sectionName === 'gallery' && (groupedSections['gallery'] || []).filter(item => item.elementKey.includes('image_')).length < 10)) && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddItem(sectionName);
                            }}
                            disabled={createMutation.isPending}
                            data-testid={`button-add-${sectionName}`}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        {sectionItems.map((item) => {
                          // Get item number to check if we should show delete button
                          let itemNumber: number | null = null;
                          if (sectionName === 'services' || sectionName === 'testimonials') {
                            const match = item.elementKey.match(/^item_(\d+)_/);
                            if (match) itemNumber = parseInt(match[1]);
                          } else if (sectionName === 'gallery') {
                            const match = item.elementKey.match(/^image_(\d+)$/);
                            if (match) itemNumber = parseInt(match[1]);
                          }

                          // Check if this is the first/primary item in a group (for paired items)
                          const isPrimaryItem =
                            (sectionName === 'services' && item.elementKey.endsWith('_heading')) ||
                            (sectionName === 'testimonials' && item.elementKey.endsWith('_text')) ||
                            (sectionName === 'gallery');

                          return (
                            <div
                              key={item.id}
                              className="p-3 border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors flex justify-between items-start"
                              data-testid={`section-item-${item.elementKey}`}
                            >
                              <div className="flex-1" onClick={() => setEditingSection(item)}>
                                <div className="font-medium capitalize text-sm">{item.elementKey.replace(/_/g, ' ')}</div>
                                <div className="text-xs text-muted-foreground truncate mt-1">
                                  {item.value?.substring(0, 40) || '(empty)'}...
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  Type: {item.contentType}
                                </div>
                              </div>
                              {isPrimaryItem && itemNumber !== null && (sectionName === 'services' || sectionName === 'testimonials' || sectionName === 'gallery') && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteItem(sectionName, item.elementKey);
                                  }}
                                  disabled={deleteMutation.isPending}
                                  className="ml-2 text-destructive hover:text-destructive"
                                  data-testid={`button-delete-${item.elementKey}`}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </div>

        {/* Edit Form & Preview */}
        <div className="space-y-4">
          {editingSection ? (
            <Card>
              <CardHeader>
                <CardTitle>Edit: {editingSection.elementKey}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {editingSection.contentType === "text" && (
                  <div>
                    <Label>Text Content</Label>
                    <Textarea
                      value={editingSection.value || ""}
                      onChange={(e) =>
                        setEditingSection({
                          ...editingSection,
                          value: e.target.value,
                        })
                      }
                      className="mt-2"
                      rows={4}
                      data-testid="textarea-content"
                    />
                  </div>
                )}

                {editingSection.contentType === "image" && (
                  <div className="space-y-4">
                    <div>
                      <Label>Upload Image (Max 5MB)</Label>
                      <div className="mt-2 border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-accent/50 transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, editingSection.id)}
                          disabled={uploadingId === editingSection.id}
                          className="hidden"
                          id={`upload-${editingSection.id}`}
                          data-testid="input-image-upload"
                        />
                        <label htmlFor={`upload-${editingSection.id}`} className="cursor-pointer block">
                          {uploadingId === editingSection.id ? (
                            <>
                              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                              <p className="text-sm text-muted-foreground">Uploading...</p>
                            </>
                          ) : (
                            <>
                              <p className="text-sm font-medium">Click to upload image</p>
                              <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 5MB</p>
                            </>
                          )}
                        </label>
                      </div>
                    </div>
                    {editingSection.value && (
                      <div className="mt-2 relative">
                        <img
                          src={editingSection.value}
                          alt={editingSection.altText || "Preview"}
                          className="w-full h-48 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => setEditingSection({ ...editingSection, value: null })}
                          className="absolute top-2 right-2 p-1 bg-red-500 rounded-full hover:bg-red-600"
                          data-testid="button-remove-image"
                        >
                          <X className="h-4 w-4 text-white" />
                        </button>
                      </div>
                    )}
                    <div>
                      <Label>Alt Text (for accessibility)</Label>
                      <Input
                        value={editingSection.altText || ""}
                        onChange={(e) =>
                          setEditingSection({
                            ...editingSection,
                            altText: e.target.value,
                          })
                        }
                        className="mt-2"
                        data-testid="input-alt-text"
                      />
                    </div>
                  </div>
                )}

                {editingSection.contentType === "button" && (
                  <div className="space-y-4">
                    <div>
                      <Label>Button Text</Label>
                      <Input
                        value={editingSection.value || ""}
                        onChange={(e) =>
                          setEditingSection({
                            ...editingSection,
                            value: e.target.value,
                          })
                        }
                        className="mt-2"
                        data-testid="input-button-text"
                      />
                    </div>
                    <div>
                      <Label>Button URL</Label>
                      <Input
                        value={editingSection.url || ""}
                        onChange={(e) =>
                          setEditingSection({
                            ...editingSection,
                            url: e.target.value,
                          })
                        }
                        placeholder="/contact"
                        className="mt-2"
                        data-testid="input-button-url"
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={() => {
                      if (editingSection) {
                        updateMutation.mutate(editingSection);
                      }
                    }}
                    disabled={updateMutation.isPending}
                    data-testid="button-save"
                    style={{ backgroundColor: 'hsl(var(--brand))', borderColor: 'hsl(var(--brand))' }}
                  >
                    {updateMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setEditingSection(null)}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                Select a section to edit
              </CardContent>
            </Card>
          )}

          {showPreview && (
            <Card>
              <CardHeader>
                <CardTitle>Live Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="w-full h-96 border rounded-lg overflow-hidden">
                  {business?.slug ? (
                    <iframe
                      key={refreshKey}
                      src={`/${business.slug}?v=${refreshKey}`}
                      className="w-full h-full border-0"
                      title="Website Preview"
                      data-testid="iframe-preview"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Preview updates when you save changes
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}