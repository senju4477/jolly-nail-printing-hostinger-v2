// Add only confirmed launch details. An empty list is an intentional pre-launch state.
export type MachineLocation = {
  id: string;
  centreName: string;
  suburb: string;
  city: string;
  postcode: string;
  level: string;
  openingHours: string;
  mapUrl: string;
  availability: "Available" | "Temporarily unavailable" | "Opening soon";
};

export const machineLocations: MachineLocation[] = [];
