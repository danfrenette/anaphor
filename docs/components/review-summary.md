# Review summaries

`RequirementSummary` presents the problem and required outcome before disclosing
acceptance conditions. `VerificationSummary` presents a criterion, recorded
result, source applicability, supersession, and observed outcome. Its children
hold execution details, receipts, or history behind a labelled native disclosure.
Both are available from `@anaphor/system` and the `review-summary` registry item.

The application supplies every status. These components neither infer source
freshness nor decide whether to merge. Keep consequential failures and unavailable
proof visible outside collapsed execution details.

Required props are explicit: RequirementSummary takes `problem`, `outcome`, and
`acceptance`; VerificationSummary takes `criterion`, `result`, `applicability`,
`superseded`, `required`, `observed`, and `detailsLabel`. Both forward native
section/article attributes and refs. Content and callbacks remain consumer-owned.

See `/review-elements` for synthetic reference examples and
[the verification recipe](../verification/review-elements.md) for observable checks.
