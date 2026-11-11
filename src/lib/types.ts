// Types shared by server and browser code.
export interface ConcertFormState {
	date: string;
	venueId: number | null;
	venueName: string;
	venueAddress: string;
	venueCity: string;
	venueCountry: string;
	/** True when the user edits the address of the chosen existing venue. */
	venueEdit?: boolean;
	event: string;
	bands: { name: string; headliner: boolean }[];
	people: string[];
	price: string;
	currency: string;
	rating: number | null;
	notes: string;
}

export type FormErrors = Partial<Record<'date' | 'venue' | 'bands' | 'price' | 'rating' | 'form', string>>;

export interface VenueOption {
	id: number;
	name: string;
	address: string | null;
	city: string | null;
	country: string | null;
}

export interface FormOptions {
	venues: VenueOption[];
	bands: string[];
	people: string[];
	events: string[];
}
