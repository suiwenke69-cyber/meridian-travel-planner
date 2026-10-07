import type { CoordinateFix } from './coord-corrections';

/**
 * Corrections a person made, kept apart from the machine-generated ones.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * The sixty-odd corrections above are produced by the audit and regenerated from
 * the review slices, which means the whole map gets rewritten whenever they are
 * re-merged — and the first time that happened, three decisions made by hand
 * disappeared silently. A regenerated file and a reviewed file need different
 * lifetimes, so they live in different files.
 *
 * These three are the records no source could place AND that were not honest
 * places to begin with: two generic activity labels and one transfer product.
 */
export const MANUAL_PLACE_COORDINATE_FIXES: Record<string, CoordinateFix> = {
  /*
   * "Batu Bolong Surf School" is a label, not a business. The street it sits on
   * is recorded by its neighbours, and the only thing a coordinate would add is
   * a second marker on somebody else's doorstep.
   */
  'canggu-batu-bolong-surf-school': {
    reason:
      'A generic label rather than a named business. No source locates this specific operation, and the street it is on is already recorded.',
  },

  /*
   * The next two are transfer PRODUCTS. A day trip from Sanur departs from Sanur
   * Harbour, and the Gili fast boat departs from the Padangbai quay — both of
   * which already have their own transport records. Anchoring a product on the
   * facility it leaves from puts two markers on one quay and shows the traveller
   * the same place twice under two names.
   */
  'sanur-nusa-lembongan-day-trip': {
    reason:
      'A transfer product, not a place. It departs from Sanur Harbour, which has its own record, so a second marker on the same quay would be a duplicate.',
  },
  'padangbai-gili-islands-fast-boat': {
    reason:
      'A transfer product, not a place. It departs from the Padangbai fast-boat quay, which is already recorded as a transport node.',
  },
};
