/**
 * A trip day is an ordered list: photos in the order they were taken, each note right after the photo it's
 * about. TripStory.astro lays them out like a phone's photo album: tiles packed edge to edge, row by row.
 */
import type { ImageMetadata } from 'astro';

export type TripPhoto = { kind: 'photo'; src: ImageMetadata; alt: string; /** "13:13" */ time: string };
export type TripNote = { kind: 'note'; text: string };
export type TripEntry = TripPhoto | TripNote;
