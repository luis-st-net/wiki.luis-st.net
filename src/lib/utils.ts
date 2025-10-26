import { twMerge } from "tailwind-merge";

type ClassValue =
	| string
	| number
	| null
	| boolean
	| undefined
	| Record<string, boolean>
	| ClassValue[];

function toArray(value: ClassValue): Array<string | number> {
	if (Array.isArray(value)) {
		return value.flatMap((item) => toArray(item));
	}

	if (typeof value === "string" || typeof value === "number") {
		return [value];
	}

	if (value && typeof value === "object") {
		return Object.entries(value)
			.filter(([, enabled]) => Boolean(enabled))
			.map(([key]) => key);
	}

	return [];
}

export function cn(...inputs: ClassValue[]): string {
	return twMerge(inputs.flatMap((input) => toArray(input)).join(" "));
}
