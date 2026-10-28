# S28 Manager of the Season: draft nominations

**Status:** draft from the league tables after 35 of 38 games (Soccer Manager Sync, 26 October 2026). Re-run after the final day (Thursday 5 November) before the vote opens.

## Method

Nominations follow the S27 pattern: champions, promotion winners and teams that did far better than their squads suggested.

- **Nomination score** = (21 − league position) + value added. Value added is predicted position minus actual position. The prediction ranks each squad's strength within its division, using the Stats & History ETOT weighting on the current squad (`public_league_season_rows`).
- **Division award:** the division leader, plus the next three highest nomination scores. Ties go to the larger value added.
- **Overall award:** the Division 1 leader, plus the five highest nomination scores in Top 100. Ties go to the larger value added, then the higher division.
- **Added by hand:** cup winners (SMFA Cup and Shield, World Club Cup, Youth Cup). The S27 nominees included them, but cup results are not in the sync data yet.

Check before publishing:

- Managers are as recorded for S27 in Stats & History. Confirm none changed during S28.
- Squad strength is the end-of-season squad, so a manager who strengthened during the season looks slightly less of an overachiever than they were.
- Olympique Lyonnais (D4) went to 51 players on 19 October (rule 4.1). Decide whether a compliance breach affects award eligibility.

## Overall Manager of the Season

| Manager | Club | Position | Predicted | Value added | Score | Achievement |
|---|---|---|---|---|---|---|
| Guerra | FC Porto | D1 1st | 10th | +9 | 29 | Division 1 leaders, from 10th last season |
| East | PSV | D5 1st | 19th | +18 | 38 | Leading Division 5 with the division's second-weakest squad |
| Ash L | Leicester City | D1 3rd | 16th | +13 | 31 | Top three in Division 1 with a bottom-five squad |
| Ioli | Ajax | D3 3rd | 16th | +13 | 31 | In the D3 promotion places a season after winning D4 |
| C. Taylor | Atalanta BC | D5 3rd | 16th | +13 | 31 | From 17th last season into the promotion places |
| Luiz | Dnipro Dnipropetrovsk | D3 5th | 19th | +14 | 30 | From 16th last season into the play-off places |

## Division 1

| Manager | Club | Position | Predicted | Value added | Achievement |
|---|---|---|---|---|---|
| Guerra | FC Porto | 1st | 10th | +9 | Division 1 leaders, from 10th last season |
| Ash L | Leicester City | 3rd | 16th | +13 | Top three again, with a bottom-five squad |
| J. Mckenzie | Chelsea | 2nd | 5th | +3 | Defending champions, still in the title race |
| Mullan | RCD Espanyol | 10th | 20th | +10 | Newly promoted, with the weakest squad in the division, now top half |

## Division 2

| Manager | Club | Position | Predicted | Value added | Achievement |
|---|---|---|---|---|---|
| Robinson | SL Benfica | 1st | 7th | +6 | Division 2 leaders, from 8th last season |
| Frankland | Udinese Calcio | 4th | 11th | +7 | From 16th last season into the play-off places |
| TRX | Sevilla FC | 7th | 15th | +8 | Chasing a second successive promotion |
| Allington | Cruzeiro EC | 3rd | 5th | +2 | Promotion places a season after relegation |

## Division 3

| Manager | Club | Position | Predicted | Value added | Achievement |
|---|---|---|---|---|---|
| Beddows | Sampdoria | 1st | 11th | +10 | Division 3 leaders, from 11th last season |
| Ioli | Ajax | 3rd | 16th | +13 | Chasing a second successive promotion |
| Luiz | Dnipro Dnipropetrovsk | 5th | 19th | +14 | From 16th last season into the play-off places |
| Guardiola | TSG 1899 Hoffenheim | 2nd | 12th | +10 | From 8th last season into the promotion places |

## Division 4

| Manager | Club | Position | Predicted | Value added | Achievement |
|---|---|---|---|---|---|
| McGoogan | Valencia CF | 1st | 1st | 0 | Leading Division 4 a season after winning Division 5 |
| Udall | Werder Bremen | 7th | 20th | +13 | Play-off places with the division's weakest squad |
| Neto | Olympique Lyonnais | 4th | 13th | +9 | Play-off places, from 8th last season (see the compliance note above) |
| Alessio | SSC Napoli | 2nd | 6th | +4 | Second, two seasons after winning Division 5 |

## Division 5

| Manager | Club | Position | Predicted | Value added | Achievement |
|---|---|---|---|---|---|
| East | PSV | 1st | 19th | +18 | Division 5 leaders, the biggest overachievement in Top 100 |
| C. Taylor | Atalanta BC | 3rd | 16th | +13 | From 17th last season into the promotion places |
| Ajmal | AZ Alkmaar | 2nd | 8th | +6 | Second, from 4th last season |
| Everland | Santos FC | 6th | 13th | +7 | Play-off places with a bottom-half squad |

## Loading into Shared Voting

Each nominee becomes a `voting_options` row. Its `metadata` holds `club`, `achievement` and `description`, which the Awards adapter displays (see `docs/shared-voting-v2-adapter.md`). Use the Achievement column above for `achievement`. Add a one-line `description` after the final day.
