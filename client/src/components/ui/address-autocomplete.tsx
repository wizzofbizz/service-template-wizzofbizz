
import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export interface AddressData {
  addressLine1: string;
  city: string;
  province: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  fullAddress: string;
}

interface AddressAutocompleteProps {
  value: string;
  onAddressSelect: (address: AddressData) => void;
  placeholder?: string;
  disabled?: boolean;
  label?: string;
  required?: boolean;
}

export function AddressAutocomplete({
  value,
  onAddressSelect,
  placeholder = "Start typing an address...",
  disabled = false,
  label = "Address",
  required = false,
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load Google Maps API
    const loadGoogleMaps = async () => {
      if (typeof google !== "undefined" && google.maps && google.maps.places) {
        initializeAutocomplete();
        return;
      }

      try {
        // Fetch API key from server
        const configRes = await fetch("/api/config/google-maps-key", { credentials: "include" });
        if (!configRes.ok) {
          throw new Error("Google Maps API key not configured");
        }
        const { apiKey } = await configRes.json();

        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
        script.async = true;
        script.defer = true;
        script.onload = () => {
          initializeAutocomplete();
        };
        script.onerror = () => {
          setError("Failed to load Google Maps");
          setIsLoading(false);
        };
        document.head.appendChild(script);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to initialize");
        setIsLoading(false);
      }
    };

    const initializeAutocomplete = () => {
      if (!inputRef.current) return;

      try {
        // Initialize autocomplete with South Africa restriction and biasing
        autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
          componentRestrictions: { country: "za" }, // Restrict to South Africa only
          fields: ["address_components", "geometry", "formatted_address"],
          types: ["address"], // Only show full addresses
        });

        // Bias results to South Africa center coordinates
        const southAfricaCenter = new google.maps.LatLng(-30.5595, 22.9375);
        const circle = new google.maps.Circle({
          center: southAfricaCenter,
          radius: 1500000, // 1500km radius covers all of SA
        });
        autocompleteRef.current.setBounds(circle.getBounds()!);

        // Listen for place selection
        autocompleteRef.current.addListener("place_changed", handlePlaceSelect);

        setIsLoading(false);
      } catch (err) {
        setError("Failed to initialize autocomplete");
        setIsLoading(false);
      }
    };

    const handlePlaceSelect = () => {
      const place = autocompleteRef.current?.getPlace();
      if (!place || !place.geometry || !place.address_components) {
        return;
      }

      const addressData = extractAddressData(place);
      if (addressData) {
        onAddressSelect(addressData);
      }
    };

    loadGoogleMaps();

    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [onAddressSelect]);

  const extractAddressData = (place: google.maps.places.PlaceResult): AddressData | null => {
    const components = place.address_components;
    if (!components || !place.geometry) return null;

    let streetNumber = "";
    let route = "";
    let city = "";
    let province = "";
    let postalCode = "";

    // Extract address components
    components.forEach((component) => {
      const types = component.types;

      if (types.includes("street_number")) {
        streetNumber = component.long_name;
      }
      if (types.includes("route")) {
        route = component.long_name;
      }
      if (types.includes("locality")) {
        city = component.long_name;
      }
      if (types.includes("administrative_area_level_1")) {
        province = component.long_name;
      }
      if (types.includes("postal_code")) {
        postalCode = component.long_name;
      }
    });

    // Construct address line 1
    const addressLine1 = [streetNumber, route].filter(Boolean).join(" ");

    return {
      addressLine1: addressLine1 || place.formatted_address || "",
      city: city || "",
      province: province || "",
      postalCode: postalCode || "",
      latitude: place.geometry.location!.lat(),
      longitude: place.geometry.location!.lng(),
      fullAddress: place.formatted_address || "",
    };
  };

  if (error) {
    return (
      <div className="space-y-2">
        {label && (
          <Label htmlFor="address-autocomplete">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </Label>
        )}
        <Input
          id="address-autocomplete"
          value={value}
          disabled={true}
          placeholder="Address autocomplete unavailable"
        />
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {label && (
        <Label htmlFor="address-autocomplete">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      <div className="relative">
        <Input
          ref={inputRef}
          id="address-autocomplete"
          defaultValue={value}
          placeholder={placeholder}
          disabled={disabled || isLoading}
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Start typing to search for South African addresses
      </p>
    </div>
  );
}
