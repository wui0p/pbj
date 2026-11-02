/**
 * A trip day is an ordered list: photos in the order they were taken, each note right after the photo it's
 * about. TripStory.astro lays them out like a phone's photo album: tiles packed edge to edge, row by row.
 */
import type { ImageMetadata } from 'astro';

export type TripPhoto = { kind: 'photo'; src: ImageMetadata; alt: string; /** "13:13" */ time: string };
/** `link`: these words of the note (written exactly as in `text`) become a link to `to`, a path on this site */
export type TripNote = { kind: 'note'; text: string; link?: { words: string; to: string } };
export type TripEntry = TripPhoto | TripNote;
