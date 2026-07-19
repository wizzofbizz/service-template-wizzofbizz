import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AddressAutocomplete, type AddressData } from "@/components/ui/address-autocomplete";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Loader2,
  CheckCircle,
  AlertCircle,
  Unlink,
  RefreshCw,
  Plus,
  Pencil,
  Trash2,
  Star,
  MessageCircle,
  Send,
  Building2, // Added for the connect button icon
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const newFontFamily = "AxLLCircular, Helvetica, Arial, sans-serif";
const newButtonColor = "#612fff";

interface DayHours {
  open: string;
  close: string;
  closed?: boolean;
}

interface RegularHours {
  monday?: DayHours;
  tuesday?: DayHours;
  wednesday?: DayHours;
  thursday?: DayHours;
  friday?: DayHours;
  saturday?: DayHours;
  sunday?: DayHours;
}

interface SpecialHours {
  startDate: string;
  endDate: string;
  openTime?: string;
  closeTime?: string;
  reason?: string;
  closed?: boolean;
}

interface SecondaryService {
  serviceId?: string;
  serviceName: string;
  description?: string;
  price?: number;
  priceRange?: string;
  serviceType?: string;
}

interface GBPProfile {
  id: string;
  businessId: string;
  gbpVerificationStatus: "unverified" | "claimed" | "verified";
  gbpSyncStatus: "idle" | "syncing" | "error" | "pending";
  gbpAccountId?: string;
  gbpBusinessId?: string;
  gbpLastSyncedAt?: string;
  gbpNextScheduledSyncAt?: string;
  gbpReviewsCount: number;
  gbpAverageRating: string;
  gbpPhotoViewsCount: number;
  gbpWebsiteClicksCount: number;
  gbpDirectionsRequestsCount: number;
  gbpPrimaryCategory?: string;
  gbpSecondaryCategories?: string[];
  gbpSecondaryCategoriesIds?: string[];
  gbpDescription?: string;
  gbpServiceAreas?: string[];
  gbpOperatingHours?: Record<string, any>;
  gbpCoverPhotoUrl?: string;
  gbpWebsiteLinks?: Record<string, any>;
  gbpBusinessHours?: Record<string, any>;
  gbpPostsEnabled: boolean;
  gbpBookingIntegrationEnabled: boolean;
  gbpLocalServicesAdsEnabled: boolean;
  gbpMessagingEnabled: boolean;
  gbpLastSyncErrorMessage?: string;
  updatedAt: string;

  gbpRegularHours?: RegularHours;
  gbpSpecialHours?: SpecialHours[];
  gbpServiceAreaType?: "RADIUS" | "POSTAL_CODES" | "AREAS";
  gbpServiceAreaRadius?: {
    centerLatitude?: number;
    centerLongitude?: number;
    radiusKm?: number;
  };
  gbpServiceAreaPostalCodes?: string[];
  gbpPrimaryService?: string;
  gbpSecondaryServices?: SecondaryService[];
  gbpAttributeKeywords?: string[];
  gbpBusinessAttributes?: Record<string, boolean>;
  gbpCustomAttributes?: { name: string; value: string }[];
  gbpOfficeVisitPolicy?: "ALLOW" | "BY_APPOINTMENT" | "NOT_ALLOWED";
  gbpWhatsappEnabled?: boolean;
  gbpWhatsappNumber?: string;
  gbpFacebookUrl?: string;
  gbpInstagramUrl?: string;
  gbpTwitterUrl?: string;
  gbpLinkedInUrl?: string;
  gbpYoutubeUrl?: string;
  gbpTikTokUrl?: string;
  gbpAppointmentBookingUrl?: string;
  gbpOpeningDate?: string;
  gbpBusinessStatus?: "OPEN" | "CLOSED_TEMPORARILY" | "CLOSED_PERMANENTLY";
}

interface Post {
  id: string;
  businessId: string;
  title: string;
  content: string;
  status: "draft" | "published" | "scheduled" | "archived";
  scheduledAt?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface Review {
  id: string;
  businessId: string;
  authorName: string;
  rating: number;
  reviewText: string;
  responseStatus: "unanswered" | "responded";
  response?: string;
  respondedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface GBPLocation {
  id: string;
  accountId: string;
  accountName: string;
  locationName: string;
  address?: string;
  primaryCategory?: string;
  websiteUrl?: string;
  phoneNumber?: string;
  isSelected: boolean;
}

interface PendingSync {
  id: string;
  gbpLocationId: string;
  normalizedData: {
    gbpBusinessName?: string;
    gbpPhone?: string;
    gbpEmail?: string;
    gbpAddressLine1?: string;
    gbpAddressLine2?: string;
    gbpCity?: string;
    gbpProvince?: string;
    gbpPostalCode?: string;
    gbpLatitude?: string;
    gbpLongitude?: string;
    gbpPrimaryCategory?: string;
    gbpSecondaryCategories?: string[];
    gbpDescription?: string;
    gbpWebsiteUrl?: string;
    gbpRegularHours?: any;
    gbpSpecialHours?: any;
  };
  fieldDiffs?: Record<string, { current: any; staged: any }>;
  approvedFields?: string[];
  rejectedFields?: string[];
  status: string;
  createdAt: string;
  expiresAt: string;
}

export default function GbpDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);
  const [disconnectConfirm, setDisconnectConfirm] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState("business");

  // Business Info Form State
  const [description, setDescription] = useState("");
  const [primaryCategory, setPrimaryCategory] = useState("");
  const [secondaryCategories, setSecondaryCategories] = useState<string[]>([]);
  const [serviceAreas, setServiceAreas] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [newSecondaryCategory, setNewSecondaryCategory] = useState("");

  // Operating Hours State
  const defaultDayHours: DayHours = { open: "09:00", close: "17:00", closed: false };
  const [regularHours, setRegularHours] = useState<RegularHours>({
    monday: { ...defaultDayHours },
    tuesday: { ...defaultDayHours },
    wednesday: { ...defaultDayHours },
    thursday: { ...defaultDayHours },
    friday: { ...defaultDayHours },
    saturday: { open: "09:00", close: "13:00", closed: false },
    sunday: { open: "09:00", close: "13:00", closed: true },
  });

  // Service Area State
  const [serviceAreaType, setServiceAreaType] = useState<"RADIUS" | "POSTAL_CODES" | "AREAS">("AREAS");
  const [serviceAreaRadius, setServiceAreaRadius] = useState<number>(25);
  const [serviceAreaPostalCodes, setServiceAreaPostalCodes] = useState<string[]>([]);

  // Services State
  const [primaryService, setPrimaryService] = useState("");

  // Attributes State
  const [businessAttributes, setBusinessAttributes] = useState<Record<string, boolean>>({
    wheelchair_accessible: false,
    accepts_credit_cards: true,
    accepts_cash: true,
    wifi_available: false,
    parking_available: false,
    appointment_required: false,
    online_booking: false,
  });

  // Office Visit Policy
  const [officeVisitPolicy, setOfficeVisitPolicy] = useState<"ALLOW" | "BY_APPOINTMENT" | "NOT_ALLOWED">("ALLOW");

  // Social & Communication State
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [twitterUrl, setTwitterUrl] = useState("");
  const [linkedInUrl, setLinkedInUrl] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [tiktokUrl, setTiktokUrl] = useState("");
  const [appointmentBookingUrl, setAppointmentBookingUrl] = useState("");

  // Opening Status
  const [openingDate, setOpeningDate] = useState("");
  const [businessStatus, setBusinessStatus] = useState<"OPEN" | "CLOSED_TEMPORARILY" | "CLOSED_PERMANENTLY">("OPEN");

  // Business Information (from business table, editable for GBP sync)
  const [gbpBusinessName, setGbpBusinessName] = useState("");
  const [gbpPhone, setGbpPhone] = useState("");
  const [gbpEmail, setGbpEmail] = useState("");
  const [gbpAddressLine1, setGbpAddressLine1] = useState("");
  const [gbpAddressLine2, setGbpAddressLine2] = useState("");
  const [gbpCity, setGbpCity] = useState("");
  const [gbpProvince, setGbpProvince] = useState("");
  const [gbpPostalCode, setGbpPostalCode] = useState("");
  const [gbpAddressInput, setGbpAddressInput] = useState("");
  const [gbpCenterLatitude, setGbpCenterLatitude] = useState<number | undefined>();
  const [gbpCenterLongitude, setGbpCenterLongitude] = useState<number | undefined>();

  // Post Form State
  const [showPostDialog, setShowPostDialog] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [postTitle, setPostTitle] = useState("");
  const [postContent, setPostContent] = useState("");
  const [postStatus, setPostStatus] = useState<"draft" | "published">("draft");

  // Review Response State
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [reviewResponse, setReviewResponse] = useState("");

  // Staging Workflow State
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [showLocationSelector, setShowLocationSelector] = useState(false);
  const [fieldApprovals, setFieldApprovals] = useState<Record<string, boolean>>({});

  // Fetch GBP Profile
  const { data: profile, isLoading, error } = useQuery<GBPProfile>({
    queryKey: ["/api/gbp/status"],
  });

  // Fetch Posts
  const { data: posts = [], isLoading: postsLoading } = useQuery<Post[]>({
    queryKey: ["/api/gbp/posts"],
    enabled: !!profile,
  });

  // Fetch Reviews
  const { data: reviews = [], isLoading: reviewsLoading } = useQuery<Review[]>({
    queryKey: ["/api/gbp/reviews"],
    enabled: !!profile,
  });

  // Fetch business info from business table
  const { data: businessData } = useQuery<any>({
    queryKey: ["/api/business/profile"],
  });

  // Fetch available GBP locations (for location selection step)
  const { data: locationsData, isLoading: locationsLoading, error: locationsError } = useQuery<{ locations: GBPLocation[] }>({
    queryKey: ["/api/gbp/locations"],
    enabled: !!profile && showLocationSelector,
  });

  // Fetch pending sync for review
  const { data: pendingSyncData, isLoading: pendingSyncLoading } = useQuery<{ hasPending: boolean; sync: PendingSync | null }>({
    queryKey: ["/api/gbp/sync/pending"],
    enabled: !!profile,
  });

  // Stage a sync from selected location
  const stageSyncMutation = useMutation({
    mutationFn: async (locationId: string) => {
      const res = await fetch("/api/gbp/sync/stage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ locationId }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to stage sync");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gbp/sync/pending"] });
      setShowLocationSelector(false);
      setSelectedLocationId(null);
      toast({ title: "Success", description: "Sync staged for review. Please review the changes below." });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to stage sync",
        variant: "destructive",
      });
    },
  });

  // Approve sync mutation
  const approveSyncMutation = useMutation({
    mutationFn: async ({ syncId, approvedFields, rejectedFields }: { syncId: string; approvedFields?: string[]; rejectedFields?: string[] }) => {
      const res = await fetch(`/api/gbp/sync/${syncId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ approvedFields, rejectedFields }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to approve sync");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gbp/sync/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/gbp/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/business/profile"] });
      setFieldApprovals({});
      toast({ title: "Success", description: "Changes applied successfully!" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to approve sync",
        variant: "destructive",
      });
    },
  });

  // Reject sync mutation
  const rejectSyncMutation = useMutation({
    mutationFn: async ({ syncId, reason }: { syncId: string; reason?: string }) => {
      const res = await fetch(`/api/gbp/sync/${syncId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to reject sync");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gbp/sync/pending"] });
      setFieldApprovals({});
      toast({ title: "Sync Rejected", description: "The staged changes have been discarded." });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reject sync",
        variant: "destructive",
      });
    },
  });

  // Update Business Profile Mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/gbp/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update profile");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gbp/status"] });
      toast({ title: "Success", description: "Business information updated" });
      setHasChanges(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  // Create/Update Post Mutation
  const upsertPostMutation = useMutation({
    mutationFn: async (data: any) => {
      const url = editingPostId ? `/api/gbp/posts/${editingPostId}` : "/api/gbp/posts";
      const method = editingPostId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to save post");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gbp/posts"] });
      toast({
        title: "Success",
        description: editingPostId ? "Post updated" : "Post created",
      });
      resetPostForm();
      setShowPostDialog(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save post",
        variant: "destructive",
      });
    },
  });

  // Delete Post Mutation
  const deletePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      const res = await fetch(`/api/gbp/posts/${postId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete post");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gbp/posts"] });
      toast({ title: "Success", description: "Post deleted" });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete post",
        variant: "destructive",
      });
    },
  });

  // Post Review Response Mutation
  const respondToReviewMutation = useMutation({
    mutationFn: async (data: { reviewId: string; response: string }) => {
      const res = await fetch(`/api/gbp/reviews/${data.reviewId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ response: data.response }),
      });
      if (!res.ok) throw new Error("Failed to respond to review");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gbp/reviews"] });
      toast({ title: "Success", description: "Response posted" });
      resetReviewForm();
      setShowReviewDialog(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to respond to review",
        variant: "destructive",
      });
    },
  });

  // Feature Toggle Mutation
  const featureToggleMutation = useMutation({
    mutationFn: async (data: { featureName: string; enabled: boolean }) => {
      const res = await fetch("/api/gbp/features", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to toggle feature");
      return res.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/gbp/status"] });
      toast({
        title: "Success",
        description: `${variables.featureName} ${variables.enabled ? "enabled" : "disabled"}`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update feature",
        variant: "destructive",
      });
    },
  });

  // Sync Mutation
  const syncMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/gbp/sync-now", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to trigger sync");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gbp/status"] });
      toast({ title: "Success", description: "Sync started" });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to trigger sync",
        variant: "destructive",
      });
    },
  });

  // Create Location Mutation - includes comprehensive form data
  const createLocationMutation = useMutation({
    mutationFn: async () => {
      const formData: Record<string, any> = {
        gbpDescription: description,
        gbpPrimaryCategory: primaryCategory,
        gbpSecondaryCategories: secondaryCategories,
        gbpServiceAreas: serviceAreas.split(",").map(a => a.trim()).filter(Boolean),
        gbpRegularHours: regularHours,
        gbpServiceAreaType: serviceAreaType,
        gbpServiceAreaRadius: serviceAreaType === "RADIUS" ? { radiusKm: serviceAreaRadius } : undefined,
        gbpServiceAreaPostalCodes: serviceAreaType === "POSTAL_CODES" ? serviceAreaPostalCodes : undefined,
        gbpPrimaryService: primaryService || undefined,
        gbpBusinessAttributes: businessAttributes,
        gbpOfficeVisitPolicy: officeVisitPolicy,
        gbpWhatsappEnabled: whatsappEnabled,
        gbpWhatsappNumber: whatsappNumber || undefined,
        gbpFacebookUrl: facebookUrl || undefined,
        gbpInstagramUrl: instagramUrl || undefined,
        gbpTwitterUrl: twitterUrl || undefined,
        gbpLinkedInUrl: linkedInUrl || undefined,
        gbpYoutubeUrl: youtubeUrl || undefined,
        gbpTikTokUrl: tiktokUrl || undefined,
        gbpAppointmentBookingUrl: appointmentBookingUrl || undefined,
        gbpOpeningDate: openingDate || undefined,
        gbpBusinessStatus: businessStatus,
      };

      // Add website URL if provided
      if (websiteUrl) {
        formData.gbpWebsiteLinks = { website: websiteUrl };
      }

      const res = await fetch("/api/gbp/create-location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Failed to create profile");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gbp/status"] });
      toast({ title: "Success", description: "Google Business Profile created" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create profile",
        variant: "destructive",
      });
    },
  });

  // Disconnect Mutation
  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/gbp/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ confirm: true }),
      });
      if (!res.ok) throw new Error("Failed to disconnect");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gbp/status"] });
      toast({ title: "Success", description: "Disconnected from Google Business Profile" });
      setShowDisconnectDialog(false);
      setDisconnectConfirm(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to disconnect",
        variant: "destructive",
      });
    },
  });

  // Populate business info from business table or profile
  useEffect(() => {
    if (businessData) {
      setGbpBusinessName(businessData.businessName || "");
      setGbpPhone(businessData.phone || "");
      setGbpEmail(businessData.email || "");
      setGbpAddressLine1(businessData.addressLine1 || "");
      setGbpAddressLine2(businessData.addressLine2 || "");
      setGbpCity(businessData.city || "");
      setGbpProvince(businessData.province || "");
      setGbpPostalCode(businessData.postalCode || "");
      setGbpCenterLatitude(businessData.addressLatitude ? parseFloat(businessData.addressLatitude) : undefined);
      setGbpCenterLongitude(businessData.addressLongitude ? parseFloat(businessData.addressLongitude) : undefined);
      if (businessData.addressLine1) {
        setGbpAddressInput(`${businessData.addressLine1}${businessData.addressLine2 ? ', ' + businessData.addressLine2 : ''}, ${businessData.city}, ${businessData.province}, ${businessData.postalCode}`);
      }
    }
  }, [businessData]);

  // Initialize form when profile loads
  useEffect(() => {
    if (profile) {
      setDescription(profile.gbpDescription || "");
      setPrimaryCategory(profile.gbpPrimaryCategory || "");
      setSecondaryCategories(profile.gbpSecondaryCategories || []);
      setServiceAreas((profile.gbpServiceAreas || []).join(", "));
      setWebsiteUrl(profile.gbpWebsiteLinks?.website || "");

      // Operating Hours
      if (profile.gbpRegularHours) {
        setRegularHours(profile.gbpRegularHours);
      }

      // Service Areas
      if (profile.gbpServiceAreaType) {
        setServiceAreaType(profile.gbpServiceAreaType);
      }
      if (profile.gbpServiceAreaRadius?.radiusKm) {
        setServiceAreaRadius(profile.gbpServiceAreaRadius.radiusKm);
      }
      if (profile.gbpServiceAreaPostalCodes) {
        setServiceAreaPostalCodes(profile.gbpServiceAreaPostalCodes);
      }

      // Services
      if (profile.gbpPrimaryService) {
        setPrimaryService(profile.gbpPrimaryService);
      }

      // Attributes
      if (profile.gbpBusinessAttributes) {
        setBusinessAttributes(prev => ({ ...prev, ...profile.gbpBusinessAttributes }));
      }
      if (profile.gbpOfficeVisitPolicy) {
        setOfficeVisitPolicy(profile.gbpOfficeVisitPolicy);
      }

      // Social URLs
      setWhatsappEnabled(profile.gbpWhatsappEnabled || false);
      setWhatsappNumber(profile.gbpWhatsappNumber || "");
      setFacebookUrl(profile.gbpFacebookUrl || "");
      setInstagramUrl(profile.gbpInstagramUrl || "");
      setTwitterUrl(profile.gbpTwitterUrl || "");
      setLinkedInUrl(profile.gbpLinkedInUrl || "");
      setYoutubeUrl(profile.gbpYoutubeUrl || "");
      setTiktokUrl(profile.gbpTikTokUrl || "");
      setAppointmentBookingUrl(profile.gbpAppointmentBookingUrl || "");

      // Opening Status
      setOpeningDate(profile.gbpOpeningDate || "");
      setBusinessStatus(profile.gbpBusinessStatus || "OPEN");
    }
  }, [profile]);

  const handleSaveBusinessInfo = () => {
    const updateData: any = {
      gbpDescription: description,
      gbpPrimaryCategory: primaryCategory,
      gbpSecondaryCategories: secondaryCategories,
      gbpServiceAreas: serviceAreas
        .split(",")
        .map((area) => area.trim())
        .filter(Boolean),

      // Operating Hours
      gbpRegularHours: regularHours,

      // Service Areas
      gbpServiceAreaType: serviceAreaType,
      gbpServiceAreaRadius: serviceAreaType === "RADIUS" ? { radiusKm: serviceAreaRadius } : undefined,
      gbpServiceAreaPostalCodes: serviceAreaType === "POSTAL_CODES" ? serviceAreaPostalCodes : undefined,

      // Services
      gbpPrimaryService: primaryService || undefined,

      // Attributes
      gbpBusinessAttributes: businessAttributes,
      gbpOfficeVisitPolicy: officeVisitPolicy,

      // Social & Communication
      gbpWhatsappEnabled: whatsappEnabled,
      gbpWhatsappNumber: whatsappNumber || undefined,
      gbpFacebookUrl: facebookUrl || undefined,
      gbpInstagramUrl: instagramUrl || undefined,
      gbpTwitterUrl: twitterUrl || undefined,
      gbpLinkedInUrl: linkedInUrl || undefined,
      gbpYoutubeUrl: youtubeUrl || undefined,
      gbpTikTokUrl: tiktokUrl || undefined,
      gbpAppointmentBookingUrl: appointmentBookingUrl || undefined,

      // Opening Status
      gbpOpeningDate: openingDate || undefined,
      gbpBusinessStatus: businessStatus,

      // Business Information (syncs to both GBP and business table)
      gbpBusinessName: gbpBusinessName,
      gbpPhone: gbpPhone,
      gbpEmail: gbpEmail,
      gbpAddressLine1: gbpAddressLine1,
      gbpAddressLine2: gbpAddressLine2,
      gbpCity: gbpCity,
      gbpProvince: gbpProvince,
      gbpPostalCode: gbpPostalCode,
      gbpCenterLatitude: gbpCenterLatitude,
      gbpCenterLongitude: gbpCenterLongitude,
    };

    if (websiteUrl) {
      updateData.gbpWebsiteLinks = { website: websiteUrl };
    }
    updateProfileMutation.mutate(updateData);
  };

  const handleSavePost = () => {
    const postData = {
      title: postTitle,
      content: postContent,
      status: postStatus,
    };
    upsertPostMutation.mutate(postData);
  };

  const handleEditPost = (post: Post) => {
    setEditingPostId(post.id);
    setPostTitle(post.title);
    setPostContent(post.content);
    setPostStatus(post.status as "draft" | "published");
    setShowPostDialog(true);
  };

  const handleRespondToReview = (review: Review) => {
    setEditingReviewId(review.id);
    setReviewResponse(review.response || "");
    setShowReviewDialog(true);
  };

  const resetPostForm = () => {
    setEditingPostId(null);
    setPostTitle("");
    setPostContent("");
    setPostStatus("draft");
  };

  const resetReviewForm = () => {
    setEditingReviewId(null);
    setReviewResponse("");
  };

  const handleInputChange = (value: string, field: string) => {
    setHasChanges(true);
    if (field === "description") setDescription(value);
    else if (field === "primaryCategory") setPrimaryCategory(value);
    else if (field === "serviceAreas") setServiceAreas(value);
    else if (field === "websiteUrl") setWebsiteUrl(value);
  };

  const handleAddSecondaryCategory = () => {
    if (newSecondaryCategory && !secondaryCategories.includes(newSecondaryCategory)) {
      setSecondaryCategories([...secondaryCategories, newSecondaryCategory]);
      setNewSecondaryCategory("");
      setHasChanges(true);
    }
  };

  const handleRemoveSecondaryCategory = (category: string) => {
    setSecondaryCategories(secondaryCategories.filter((c) => c !== category));
    setHasChanges(true);
  };

  if (!profile && isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    // Profile doesn't exist - show connect button
    if (!isLoading) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Connect Google Business Profile</CardTitle>
            <CardDescription>
              Link your Google Business Profile to manage your business information, posts, and reviews directly from your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Click below to connect your Google Business Profile. You'll be redirected to Google to authorize the connection.
            </p>
            <Button 
              onClick={() => {
                window.location.href = "/api/gbp/connect";
              }}
              data-testid="button-connect-gbp"
              size="lg"
              style={{ backgroundColor: newButtonColor, borderColor: newButtonColor }}
            >
              Connect to Google Business Profile
            </Button>
          </CardContent>
        </Card>
      );
    }
    return null;
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <p>Failed to load Google Business Profile</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6" style={{ fontFamily: newFontFamily }}>
      <div>
        <h1 className="text-3xl font-bold">Google Business Profile</h1>
        <p className="text-muted-foreground mt-2">Manage your business across Google</p>
      </div>

      {/* Connection Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {profile.gbpVerificationStatus === "verified" ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Connected
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  Not Verified
                </>
              )}
            </CardTitle>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => syncMutation.mutate()}
                disabled={syncMutation.isPending}
                data-testid="button-sync-gbp"
                style={{ backgroundColor: newButtonColor, borderColor: newButtonColor }}
              >
                {syncMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Sync Now
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setShowDisconnectDialog(true)}
                disabled={disconnectMutation.isPending}
                data-testid="button-disconnect-gbp"
              >
                <Unlink className="h-4 w-4 mr-2" />
                Disconnect
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {profile.gbpSyncStatus === "pending" && !profile.gbpBusinessId && (
            <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md p-3 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-900 dark:text-amber-200">Create Google Business Profile</p>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-1 mb-3">No business profile exists yet. Create a new profile on Google Business using your business information.</p>
                <Button
                  size="sm"
                  onClick={() => createLocationMutation.mutate()}
                  disabled={createLocationMutation.isPending}
                  data-testid="button-create-gbp-profile"
                  style={{ backgroundColor: newButtonColor, borderColor: newButtonColor }}
                >
                  {createLocationMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  Create Profile
                </Button>
              </div>
            </div>
          )}
          {profile.gbpSyncStatus === "pending" && profile.gbpBusinessId && (
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md p-3 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-200">Profile Awaiting Sync</p>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">Your Google Business Profile is connected but business details are waiting to be synced. Click "Sync Now" to fetch your real profile data from Google.</p>
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Sync Status</p>
              <Badge variant={profile.gbpSyncStatus === "idle" ? "default" : "secondary"}>
                {profile.gbpSyncStatus === "idle" ? "synced" : profile.gbpSyncStatus}
              </Badge>
            </div>
            <div>
              <p className="text-muted-foreground">Reviews</p>
              <p className="font-medium">{profile.gbpReviewsCount || "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Rating</p>
              <p className="font-medium">{profile.gbpAverageRating || "—"}</p>
            </div>
            {profile.gbpLastSyncedAt && (
              <div>
                <p className="text-muted-foreground">Last Synced</p>
                <p className="font-medium text-xs">
                  {formatDistanceToNow(new Date(profile.gbpLastSyncedAt), { addSuffix: true })}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Location Selection (when no location linked and no pending sync) */}
      {profile && !profile.gbpBusinessId && !pendingSyncData?.hasPending && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              Select Your Business Location
            </CardTitle>
            <CardDescription>
              Choose which Google Business Profile location to link to this account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!showLocationSelector ? (
              <Button 
                onClick={() => setShowLocationSelector(true)}
                data-testid="button-select-location"
                style={{ backgroundColor: newButtonColor, borderColor: newButtonColor }}
              >
                Choose Business Location
              </Button>
            ) : (
              <>
                {locationsLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Loading your locations...</span>
                  </div>
                ) : locationsError ? (
                  <div className="text-center py-6">
                    <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                    <p className="font-medium text-red-600">Rate Limit Exceeded</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Google's API is temporarily limiting requests. Please wait a few minutes and try again.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowLocationSelector(false);
                        setTimeout(() => setShowLocationSelector(true), 100);
                      }}
                      className="mt-4"
                    >
                      Try Again
                    </Button>
                  </div>
                ) : locationsData?.locations && locationsData.locations.length > 0 ? (
                  <div className="space-y-3">
                    {locationsData.locations.map((location) => (
                      <div
                        key={location.id}
                        className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                          selectedLocationId === location.id
                            ? "border-primary bg-primary/5"
                            : "hover:border-primary/50"
                        }`}
                        onClick={() => setSelectedLocationId(location.id)}
                        data-testid={`location-option-${location.id}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium">{location.locationName}</p>
                            {location.address && (
                              <p className="text-sm text-muted-foreground">{location.address}</p>
                            )}
                            {location.primaryCategory && (
                              <Badge variant="secondary" className="mt-1">{location.primaryCategory}</Badge>
                            )}
                          </div>
                          {selectedLocationId === location.id && (
                            <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                          )}
                        </div>
                      </div>
                    ))}
                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={() => selectedLocationId && stageSyncMutation.mutate(selectedLocationId)}
                        disabled={!selectedLocationId || stageSyncMutation.isPending}
                        data-testid="button-stage-sync"
                        style={{ backgroundColor: newButtonColor, borderColor: newButtonColor }}
                      >
                        {stageSyncMutation.isPending ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : null}
                        Continue with Selected Location
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowLocationSelector(false);
                          setSelectedLocationId(null);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <AlertCircle className="h-8 w-8 text-amber-600 mx-auto mb-2" />
                    <p className="font-medium">No Google Business Locations Found</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      You need to create a Google Business Profile first. Visit{" "}
                      <a 
                        href="https://business.google.com" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        business.google.com
                      </a>{" "}
                      to claim or create your business profile.
                    </p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Staged Sync Review Card */}
      {pendingSyncData?.hasPending && pendingSyncData.sync && (
        <Card className="border-blue-200 dark:border-blue-800">
          <CardHeader className="bg-blue-50 dark:bg-blue-950 border-b border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-200">
                  <RefreshCw className="h-5 w-5" />
                  Review Pending Changes
                </CardTitle>
                <CardDescription className="text-blue-700 dark:text-blue-300">
                  Review and approve the data pulled from your Google Business Profile
                </CardDescription>
              </div>
              <Badge variant="outline" className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                Expires {formatDistanceToNow(new Date(pendingSyncData.sync.expiresAt), { addSuffix: true })}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {/* Field Comparison Table */}
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                The following data was retrieved from Google. Toggle the checkbox to approve each field. Unchecked fields will not be updated.
              </p>

              <div className="border rounded-lg divide-y">
                {/* Business Name */}
                {pendingSyncData.sync.normalizedData.gbpBusinessName && (
                  <div className="flex items-center p-3 gap-4">
                    <Checkbox
                      id="approve-businessName"
                      checked={fieldApprovals.businessName !== false}
                      onCheckedChange={(checked) => setFieldApprovals(prev => ({ ...prev, businessName: !!checked }))}
                      data-testid="checkbox-approve-businessName"
                    />
                    <div className="flex-1 min-w-0">
                      <Label htmlFor="approve-businessName" className="font-medium">Business Name</Label>
                      <div className="flex items-center gap-2 mt-1">
                        {pendingSyncData.sync.fieldDiffs?.businessName ? (
                          <>
                            <span className="text-sm text-muted-foreground line-through truncate">
                              {pendingSyncData.sync.fieldDiffs.businessName.current || "(empty)"}
                            </span>
                            <span className="text-sm">→</span>
                            <span className="text-sm font-medium text-green-600 dark:text-green-400 truncate">
                              {pendingSyncData.sync.normalizedData.gbpBusinessName}
                            </span>
                          </>
                        ) : (
                          <span className="text-sm">{pendingSyncData.sync.normalizedData.gbpBusinessName}</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Phone */}
                {pendingSyncData.sync.normalizedData.gbpPhone && (
                  <div className="flex items-center p-3 gap-4">
                    <Checkbox
                      id="approve-phone"
                      checked={fieldApprovals.phone !== false}
                      onCheckedChange={(checked) => setFieldApprovals(prev => ({ ...prev, phone: !!checked }))}
                      data-testid="checkbox-approve-phone"
                    />
                    <div className="flex-1 min-w-0">
                      <Label htmlFor="approve-phone" className="font-medium">Phone</Label>
                      <div className="flex items-center gap-2 mt-1">
                        {pendingSyncData.sync.fieldDiffs?.phone ? (
                          <>
                            <span className="text-sm text-muted-foreground line-through truncate">
                              {pendingSyncData.sync.fieldDiffs.phone.current || "(empty)"}
                            </span>
                            <span className="text-sm">→</span>
                            <span className="text-sm font-medium text-green-600 dark:text-green-400 truncate">
                              {pendingSyncData.sync.normalizedData.gbpPhone}
                            </span>
                          </>
                        ) : (
                          <span className="text-sm">{pendingSyncData.sync.normalizedData.gbpPhone}</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Address */}
                {pendingSyncData.sync.normalizedData.gbpAddressLine1 && (
                  <div className="flex items-center p-3 gap-4">
                    <Checkbox
                      id="approve-address"
                      checked={fieldApprovals.addressLine1 !== false}
                      onCheckedChange={(checked) => setFieldApprovals(prev => ({ ...prev, addressLine1: !!checked }))}
                      data-testid="checkbox-approve-address"
                    />
                    <div className="flex-1 min-w-0">
                      <Label htmlFor="approve-address" className="font-medium">Address</Label>
                      <div className="mt-1">
                        <span className="text-sm">
                          {[
                            pendingSyncData.sync.normalizedData.gbpAddressLine1,
                            pendingSyncData.sync.normalizedData.gbpAddressLine2,
                            pendingSyncData.sync.normalizedData.gbpCity,
                            pendingSyncData.sync.normalizedData.gbpProvince,
                            pendingSyncData.sync.normalizedData.gbpPostalCode,
                          ].filter(Boolean).join(", ")}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Category */}
                {pendingSyncData.sync.normalizedData.gbpPrimaryCategory && (
                  <div className="flex items-center p-3 gap-4">
                    <Checkbox
                      id="approve-category"
                      checked={fieldApprovals.category !== false}
                      onCheckedChange={(checked) => setFieldApprovals(prev => ({ ...prev, category: !!checked }))}
                      data-testid="checkbox-approve-category"
                    />
                    <div className="flex-1 min-w-0">
                      <Label htmlFor="approve-category" className="font-medium">Business Category</Label>
                      <div className="mt-1 flex flex-wrap gap-1">
                        <Badge>{pendingSyncData.sync.normalizedData.gbpPrimaryCategory}</Badge>
                        {pendingSyncData.sync.normalizedData.gbpSecondaryCategories?.map((cat, i) => (
                          <Badge key={i} variant="secondary">{cat}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Description */}
                {pendingSyncData.sync.normalizedData.gbpDescription && (
                  <div className="flex items-center p-3 gap-4">
                    <Checkbox
                      id="approve-description"
                      checked={fieldApprovals.description !== false}
                      onCheckedChange={(checked) => setFieldApprovals(prev => ({ ...prev, description: !!checked }))}
                      data-testid="checkbox-approve-description"
                    />
                    <div className="flex-1 min-w-0">
                      <Label htmlFor="approve-description" className="font-medium">Description</Label>
                      <p className="text-sm mt-1 line-clamp-2">{pendingSyncData.sync.normalizedData.gbpDescription}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  const approvedFields = Object.entries(fieldApprovals)
                    .filter(([, approved]) => approved !== false)
                    .map(([field]) => field);
                  const rejectedFields = Object.entries(fieldApprovals)
                    .filter(([, approved]) => approved === false)
                    .map(([field]) => field);

                  approveSyncMutation.mutate({
                    syncId: pendingSyncData.sync!.id,
                    approvedFields: approvedFields.length > 0 ? approvedFields : undefined,
                    rejectedFields: rejectedFields.length > 0 ? rejectedFields : undefined,
                  });
                }}
                disabled={approveSyncMutation.isPending}
                data-testid="button-approve-sync"
                style={{ backgroundColor: newButtonColor, borderColor: newButtonColor }}
              >
                {approveSyncMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Apply Selected Changes
              </Button>
              <Button
                variant="outline"
                onClick={() => rejectSyncMutation.mutate({ syncId: pendingSyncData.sync!.id })}
                disabled={rejectSyncMutation.isPending}
                data-testid="button-reject-sync"
              >
                {rejectSyncMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Discard All
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabbed Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="business" data-testid="tab-business-info" style={{ fontFamily: newFontFamily }}>
            Business Info
          </TabsTrigger>
          <TabsTrigger value="posts" data-testid="tab-posts" style={{ fontFamily: newFontFamily }}>
            Posts ({posts.length})
          </TabsTrigger>
          <TabsTrigger value="reviews" data-testid="tab-reviews" style={{ fontFamily: newFontFamily }}>
            Reviews ({reviews.length})
          </TabsTrigger>
          <TabsTrigger value="settings" data-testid="tab-settings" style={{ fontFamily: newFontFamily }}>
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Business Info Tab */}
        <TabsContent value="business">
          <Card>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
              <CardDescription>Update your business details visible on Google</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="description">Business Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => handleInputChange(e.target.value, "description")}
                  placeholder="Describe your business..."
                  className="min-h-[120px]"
                  maxLength={2000}
                  data-testid="input-gbp-description"
                  style={{ fontFamily: newFontFamily }}
                />
                <p className="text-xs text-muted-foreground">{description.length}/2000</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="primaryCategory">Primary Category</Label>
                <Select
                  value={primaryCategory}
                  onValueChange={(value) => {
                    setPrimaryCategory(value);
                    setHasChanges(true);
                  }}
                >
                  <SelectTrigger id="primaryCategory" data-testid="select-primary-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="plumbing">Plumbing</SelectItem>
                    <SelectItem value="electrical">Electrical</SelectItem>
                    <SelectItem value="hvac">HVAC</SelectItem>
                    <SelectItem value="roofing">Roofing</SelectItem>
                    <SelectItem value="cleaning">Cleaning</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Secondary Categories</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add category"
                    value={newSecondaryCategory}
                    onChange={(e) => setNewSecondaryCategory(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") handleAddSecondaryCategory();
                    }}
                    data-testid="input-secondary-category"
                    style={{ fontFamily: newFontFamily }}
                  />
                  <Button size="sm" onClick={handleAddSecondaryCategory} variant="outline" style={{ backgroundColor: newButtonColor, borderColor: newButtonColor }}>
                    Add
                  </Button>
                </div>
                {secondaryCategories.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {secondaryCategories.map((cat) => (
                      <Badge
                        key={cat}
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => handleRemoveSecondaryCategory(cat)}
                      >
                        {cat} ✕
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Business Information with Address Autocomplete */}
              <div className="space-y-4 border-t pt-6">
                <div>
                  <h3 className="text-lg font-semibold">Business Information</h3>
                  <p className="text-sm text-muted-foreground">Core business details (syncs to both GBP and website)</p>
                </div>

                <AddressAutocomplete
                  value={gbpAddressInput}
                  onAddressSelect={(address: AddressData) => {
                    setGbpAddressInput(address.fullAddress);
                    setGbpAddressLine1(address.addressLine1);
                    setGbpAddressLine2("");
                    setGbpCity(address.city);
                    setGbpProvince(address.province);
                    setGbpPostalCode(address.postalCode);
                    setGbpCenterLatitude(address.latitude);
                    setGbpCenterLongitude(address.longitude);
                    setHasChanges(true);
                  }}
                  label="Business Address"
                  placeholder="Start typing your business address..."
                  data-testid="input-gbp-address-autocomplete"
                  inputStyle={{ fontFamily: newFontFamily }}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Business Name</Label>
                    <Input
                      value={gbpBusinessName}
                      onChange={(e) => { setGbpBusinessName(e.target.value); setHasChanges(true); }}
                      placeholder="Your business name"
                      data-testid="input-gbp-business-name"
                      style={{ fontFamily: newFontFamily }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input
                      value={gbpPhone}
                      onChange={(e) => { setGbpPhone(e.target.value); setHasChanges(true); }}
                      placeholder="+27 XX XXX XXXX"
                      data-testid="input-gbp-phone"
                      style={{ fontFamily: newFontFamily }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={gbpEmail}
                      onChange={(e) => { setGbpEmail(e.target.value); setHasChanges(true); }}
                      placeholder="info@business.com"
                      data-testid="input-gbp-email"
                      style={{ fontFamily: newFontFamily }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Postal Code</Label>
                    <Input
                      value={gbpPostalCode}
                      onChange={(e) => { setGbpPostalCode(e.target.value); setHasChanges(true); }}
                      placeholder="7600"
                      data-testid="input-gbp-postal-code"
                      style={{ fontFamily: newFontFamily }}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="websiteUrl">Website URL</Label>
                <Input
                  id="websiteUrl"
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => handleInputChange(e.target.value, "websiteUrl")}
                  placeholder="https://yourwebsite.com"
                  data-testid="input-website-url"
                  style={{ fontFamily: newFontFamily }}
                />
              </div>

              {/* Operating Hours Section */}
              <div className="space-y-4 border-t pt-6">
                <div>
                  <h3 className="text-lg font-semibold">Operating Hours</h3>
                  <p className="text-sm text-muted-foreground">Set your regular business hours</p>
                </div>

                <div className="space-y-3">
                  {(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const).map((day) => (
                    <div key={day} className="flex items-center gap-4">
                      <div className="w-24 capitalize font-medium" style={{ fontFamily: newFontFamily }}>{day}</div>
                      <Checkbox
                        checked={!regularHours[day]?.closed}
                        onCheckedChange={(checked) => {
                          setRegularHours(prev => ({
                            ...prev,
                            [day]: { ...prev[day]!, closed: !checked }
                          }));
                          setHasChanges(true);
                        }}
                        data-testid={`checkbox-${day}-open`}
                      />
                      <span className="text-sm w-12" style={{ fontFamily: newFontFamily }}>{regularHours[day]?.closed ? "Closed" : "Open"}</span>
                      {!regularHours[day]?.closed && (
                        <>
                          <Input
                            type="time"
                            value={regularHours[day]?.open || "09:00"}
                            onChange={(e) => {
                              setRegularHours(prev => ({
                                ...prev,
                                [day]: { ...prev[day]!, open: e.target.value }
                              }));
                              setHasChanges(true);
                            }}
                            className="w-32"
                            data-testid={`input-${day}-open`}
                            style={{ fontFamily: newFontFamily }}
                          />
                          <span style={{ fontFamily: newFontFamily }}>to</span>
                          <Input
                            type="time"
                            value={regularHours[day]?.close || "17:00"}
                            onChange={(e) => {
                              setRegularHours(prev => ({
                                ...prev,
                                [day]: { ...prev[day]!, close: e.target.value }
                              }));
                              setHasChanges(true);
                            }}
                            className="w-32"
                            data-testid={`input-${day}-close`}
                            style={{ fontFamily: newFontFamily }}
                          />
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Service Area Configuration */}
              <div className="space-y-4 border-t pt-6">
                <div>
                  <h3 className="text-lg font-semibold">Service Area</h3>
                  <p className="text-sm text-muted-foreground">Define where you provide services</p>
                </div>

                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Service Area Type</Label>
                    <Select
                      value={serviceAreaType}
                      onValueChange={(v: "RADIUS" | "POSTAL_CODES" | "AREAS") => {
                        setServiceAreaType(v);
                        setHasChanges(true);
                      }}
                    >
                      <SelectTrigger data-testid="select-service-area-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AREAS">Named Areas</SelectItem>
                        <SelectItem value="RADIUS">Radius from Location</SelectItem>
                        <SelectItem value="POSTAL_CODES">Postal Codes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {serviceAreaType === "RADIUS" && (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label>Service Radius (km)</Label>
                        <Input
                          type="number"
                          min={1}
                          max={200}
                          value={serviceAreaRadius}
                          onChange={(e) => {
                            setServiceAreaRadius(parseInt(e.target.value) || 25);
                            setHasChanges(true);
                          }}
                          data-testid="input-service-radius"
                          style={{ fontFamily: newFontFamily }}
                        />
                      </div>
                      {gbpCenterLatitude && gbpCenterLongitude && (
                        <p className="text-xs text-muted-foreground">
                          Center: {gbpCenterLatitude.toFixed(4)}, {gbpCenterLongitude.toFixed(4)}
                        </p>
                      )}
                    </div>
                  )}

                  {serviceAreaType === "POSTAL_CODES" && (
                    <div className="space-y-2">
                      <Label>Postal Codes (comma-separated)</Label>
                      <Textarea
                        value={serviceAreaPostalCodes.join(", ")}
                        onChange={(e) => {
                          setServiceAreaPostalCodes(e.target.value.split(",").map(s => s.trim()).filter(Boolean));
                          setHasChanges(true);
                        }}
                        placeholder="7600, 7620, 7700"
                        data-testid="input-postal-codes"
                        style={{ fontFamily: newFontFamily }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Office Visit Policy */}
              <div className="space-y-4 border-t pt-6">
                <div>
                  <h3 className="text-lg font-semibold">Office Visits</h3>
                  <p className="text-sm text-muted-foreground">Do customers visit your location?</p>
                </div>

                <Select
                  value={officeVisitPolicy}
                  onValueChange={(v: "ALLOW" | "BY_APPOINTMENT" | "NOT_ALLOWED") => {
                    setOfficeVisitPolicy(v);
                    setHasChanges(true);
                  }}
                >
                  <SelectTrigger data-testid="select-office-visit-policy">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALLOW">Yes, walk-ins welcome</SelectItem>
                    <SelectItem value="BY_APPOINTMENT">By appointment only</SelectItem>
                    <SelectItem value="NOT_ALLOWED">No, service at customer location only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Business Attributes */}
              <div className="space-y-4 border-t pt-6">
                <div>
                  <h3 className="text-lg font-semibold">Business Attributes</h3>
                  <p className="text-sm text-muted-foreground">Features and highlights of your business</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(businessAttributes).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      <Checkbox
                        checked={value}
                        onCheckedChange={(checked) => {
                          setBusinessAttributes(prev => ({ ...prev, [key]: !!checked }));
                          setHasChanges(true);
                        }}
                        data-testid={`checkbox-attr-${key}`}
                      />
                      <Label className="text-sm cursor-pointer capitalize" style={{ fontFamily: newFontFamily }}>
                        {key.replace(/_/g, " ")}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Social Links & Communication */}
              <div className="space-y-4 border-t pt-6">
                <div>
                  <h3 className="text-lg font-semibold">Social & Communication</h3>
                  <p className="text-sm text-muted-foreground">Connect your social profiles and communication channels</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Facebook URL</Label>
                    <Input
                      value={facebookUrl}
                      onChange={(e) => { setFacebookUrl(e.target.value); setHasChanges(true); }}
                      placeholder="https://facebook.com/..."
                      data-testid="input-facebook-url"
                      style={{ fontFamily: newFontFamily }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Instagram URL</Label>
                    <Input
                      value={instagramUrl}
                      onChange={(e) => { setInstagramUrl(e.target.value); setHasChanges(true); }}
                      placeholder="https://instagram.com/..."
                      data-testid="input-instagram-url"
                      style={{ fontFamily: newFontFamily }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Twitter/X URL</Label>
                    <Input
                      value={twitterUrl}
                      onChange={(e) => { setTwitterUrl(e.target.value); setHasChanges(true); }}
                      placeholder="https://twitter.com/..."
                      data-testid="input-twitter-url"
                      style={{ fontFamily: newFontFamily }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>LinkedIn URL</Label>
                    <Input
                      value={linkedInUrl}
                      onChange={(e) => { setLinkedInUrl(e.target.value); setHasChanges(true); }}
                      placeholder="https://linkedin.com/..."
                      data-testid="input-linkedin-url"
                      style={{ fontFamily: newFontFamily }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>YouTube URL</Label>
                    <Input
                      value={youtubeUrl}
                      onChange={(e) => { setYoutubeUrl(e.target.value); setHasChanges(true); }}
                      placeholder="https://youtube.com/..."
                      data-testid="input-youtube-url"
                      style={{ fontFamily: newFontFamily }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>TikTok URL</Label>
                    <Input
                      value={tiktokUrl}
                      onChange={(e) => { setTiktokUrl(e.target.value); setHasChanges(true); }}
                      placeholder="https://tiktok.com/..."
                      data-testid="input-tiktok-url"
                      style={{ fontFamily: newFontFamily }}
                    />
                  </div>
                </div>

                {/* WhatsApp Integration */}
                <div className="space-y-3 mt-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={whatsappEnabled}
                      onCheckedChange={(checked) => { setWhatsappEnabled(checked); setHasChanges(true); }}
                      data-testid="switch-whatsapp-enabled"
                    />
                    <Label>Enable WhatsApp Business</Label>
                  </div>

                  {whatsappEnabled && (
                    <div className="space-y-2">
                      <Label>WhatsApp Number</Label>
                      <Input
                        value={whatsappNumber}
                        onChange={(e) => { setWhatsappNumber(e.target.value); setHasChanges(true); }}
                        placeholder="+27 123 456 789"
                        data-testid="input-whatsapp-number"
                        style={{ fontFamily: newFontFamily }}
                      />
                    </div>
                  )}
                </div>

                {/* Booking URL */}
                <div className="space-y-2 mt-4">
                  <Label>Appointment Booking URL</Label>
                  <Input
                    value={appointmentBookingUrl}
                    onChange={(e) => { setAppointmentBookingUrl(e.target.value); setHasChanges(true); }}
                    placeholder="https://calendly.com/... or your booking page"
                    data-testid="input-booking-url"
                    style={{ fontFamily: newFontFamily }}
                  />
                </div>
              </div>

              {/* Business Status */}
              <div className="space-y-4 border-t pt-6">
                <div>
                  <h3 className="text-lg font-semibold">Business Status</h3>
                  <p className="text-sm text-muted-foreground">Current operating status</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Opening Date</Label>
                    <Input
                      type="date"
                      value={openingDate}
                      onChange={(e) => { setOpeningDate(e.target.value); setHasChanges(true); }}
                      data-testid="input-opening-date"
                      style={{ fontFamily: newFontFamily }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Business Status</Label>
                    <Select
                      value={businessStatus}
                      onValueChange={(v: "OPEN" | "CLOSED_TEMPORARILY" | "CLOSED_PERMANENTLY") => {
                        setBusinessStatus(v);
                        setHasChanges(true);
                      }}
                    >
                      <SelectTrigger data-testid="select-business-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="OPEN">Open</SelectItem>
                        <SelectItem value="CLOSED_TEMPORARILY">Temporarily Closed</SelectItem>
                        <SelectItem value="CLOSED_PERMANENTLY">Permanently Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleSaveBusinessInfo}
                disabled={updateProfileMutation.isPending || !hasChanges}
                className="mt-6"
                data-testid="button-save-gbp"
                style={{ backgroundColor: newButtonColor, borderColor: newButtonColor }}
              >
                {updateProfileMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Posts Tab */}
        <TabsContent value="posts">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Business Posts</CardTitle>
                  <CardDescription>Create and manage business posts</CardDescription>
                </div>
                <Button
                  onClick={() => {
                    resetPostForm();
                    setShowPostDialog(true);
                  }}
                  size="sm"
                  data-testid="button-new-post"
                  style={{ backgroundColor: newButtonColor, borderColor: newButtonColor }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Post
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {postsLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : posts.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No posts yet</p>
              ) : (
                <div className="space-y-3">
                  {posts.map((post) => (
                    <div
                      key={post.id}
                      className="p-4 border rounded-lg space-y-2"
                      data-testid={`card-post-${post.id}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold" style={{ fontFamily: newFontFamily }}>{post.title}</h3>
                          <Badge
                            variant={post.status === "published" ? "default" : "secondary"}
                            className="mt-1"
                          >
                            {post.status}
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditPost(post)}
                            data-testid={`button-edit-post-${post.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deletePostMutation.mutate(post.id)}
                            disabled={deletePostMutation.isPending}
                            data-testid={`button-delete-post-${post.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2" style={{ fontFamily: newFontFamily }}>{post.content}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reviews Tab */}
        <TabsContent value="reviews">
          <Card>
            <CardHeader>
              <CardTitle>Customer Reviews</CardTitle>
              <CardDescription>View and respond to customer reviews</CardDescription>
            </CardHeader>
            <CardContent>
              {reviewsLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : reviews.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No reviews yet</p>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="p-4 border rounded-lg space-y-3" data-testid={`card-review-${review.id}`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold" style={{ fontFamily: newFontFamily }}>{review.authorName}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                        <Badge
                          variant={review.responseStatus === "responded" ? "default" : "secondary"}
                        >
                          {review.responseStatus}
                        </Badge>
                      </div>
                      <p className="text-sm" style={{ fontFamily: newFontFamily }}>{review.reviewText}</p>
                      {review.response && (
                        <div className="bg-muted p-3 rounded space-y-1">
                          <p className="text-xs font-semibold text-muted-foreground">Your Response:</p>
                          <p className="text-sm" style={{ fontFamily: newFontFamily }}>{review.response}</p>
                        </div>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRespondToReview(review)}
                        disabled={respondToReviewMutation.isPending}
                        data-testid={`button-respond-${review.id}`}
                        style={{ backgroundColor: newButtonColor, borderColor: newButtonColor }}
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        {review.responseStatus === "responded" ? "Edit Response" : "Respond"}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Features</CardTitle>
              <CardDescription>Enable or disable GBP features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { name: "posts", label: "Posts", description: "Create business posts" },
                {
                  name: "booking_integration",
                  label: "Booking",
                  description: "Allow appointment booking",
                },
                {
                  name: "local_services_ads",
                  label: "Local Services Ads",
                  description: "Run local ads campaigns",
                },
                { name: "messaging", label: "Messaging", description: "Enable messaging" },
              ].map((feature) => (
                <div
                  key={feature.name}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium" style={{ fontFamily: newFontFamily }}>{feature.label}</p>
                    <p className="text-sm text-muted-foreground" style={{ fontFamily: newFontFamily }}>{feature.description}</p>
                  </div>
                  <Switch
                    checked={
                      feature.name === "posts"
                        ? profile.gbpPostsEnabled
                        : feature.name === "booking_integration"
                          ? profile.gbpBookingIntegrationEnabled
                          : feature.name === "local_services_ads"
                            ? profile.gbpLocalServicesAdsEnabled
                            : profile.gbpMessagingEnabled
                    }
                    onCheckedChange={(enabled) => {
                      featureToggleMutation.mutate({
                        featureName: feature.name,
                        enabled,
                      });
                    }}
                    disabled={featureToggleMutation.isPending}
                    data-testid={`switch-feature-${feature.name}`}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Post Dialog */}
      <Dialog open={showPostDialog} onOpenChange={setShowPostDialog}>
        <DialogContent data-testid="dialog-post">
          <DialogHeader>
            <DialogTitle>{editingPostId ? "Edit Post" : "New Post"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="postTitle">Title</Label>
              <Input
                id="postTitle"
                value={postTitle}
                onChange={(e) => setPostTitle(e.target.value)}
                placeholder="Post title"
                data-testid="input-post-title"
                style={{ fontFamily: newFontFamily }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="postContent">Content</Label>
              <Textarea
                id="postContent"
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                placeholder="What's new?"
                className="min-h-[120px]"
                data-testid="input-post-content"
                style={{ fontFamily: newFontFamily }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="postStatus">Status</Label>
              <Select value={postStatus} onValueChange={(value: any) => setPostStatus(value)}>
                <SelectTrigger id="postStatus" data-testid="select-post-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPostDialog(false)}
              data-testid="button-cancel-post"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSavePost}
              disabled={upsertPostMutation.isPending || !postTitle || !postContent}
              data-testid="button-save-post"
              style={{ backgroundColor: newButtonColor, borderColor: newButtonColor }}
            >
              {upsertPostMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Save Post
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Response Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent data-testid="dialog-review-response">
          <DialogHeader>
            <DialogTitle>Respond to Review</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reviewResponse">Your Response</Label>
              <Textarea
                id="reviewResponse"
                value={reviewResponse}
                onChange={(e) => setReviewResponse(e.target.value)}
                placeholder="Write your response..."
                className="min-h-[120px]"
                data-testid="input-review-response"
                style={{ fontFamily: newFontFamily }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowReviewDialog(false)}
              data-testid="button-cancel-response"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (editingReviewId) {
                  respondToReviewMutation.mutate({
                    reviewId: editingReviewId,
                    response: reviewResponse,
                  });
                }
              }}
              disabled={respondToReviewMutation.isPending || !reviewResponse}
              data-testid="button-save-response"
              style={{ backgroundColor: newButtonColor, borderColor: newButtonColor }}
            >
              {respondToReviewMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Post Response
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disconnect Dialog */}
      <AlertDialog open={showDisconnectDialog} onOpenChange={setShowDisconnectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect Google Business Profile?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove your GBP connection. Reconnect anytime.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="disconnect-confirm"
                checked={disconnectConfirm}
                onCheckedChange={(checked) => setDisconnectConfirm(checked as boolean)}
                data-testid="checkbox-disconnect-confirm"
              />
              <Label htmlFor="disconnect-confirm" className="cursor-pointer font-normal" style={{ fontFamily: newFontFamily }}>
                I understand this action cannot be undone
              </Label>
            </div>
          </div>
          <div className="flex gap-2">
            <AlertDialogCancel data-testid="button-cancel-disconnect">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => disconnectMutation.mutate()}
              disabled={!disconnectConfirm || disconnectMutation.isPending}
              className="bg-destructive hover:bg-destructive/90"
              data-testid="button-confirm-disconnect"
            >
              {disconnectMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Disconnect
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}