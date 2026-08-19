/**
 * Rows ticked on the findings list, held centrally so the selection survives
 * navigation to the comparison screen.
 */
export interface SelectionState {
  /**
   * `Vulnerability.id` values, in the order they were ticked.
   *
   * An array rather than a Set because Redux state has to stay serialisable —
   * a Set breaks the store's serializability check, DevTools time travel, and
   * anything that persists or rehydrates state later. Membership tests read
   * through `selectSelectedIdSet`, which memoises the Set so the O(1) lookups
   * the table needs are still O(1).
   */
  ids: number[];
}
