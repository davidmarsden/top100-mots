# S28 Manager of the Season: nominations

**Status:** final, for loading into Shared Voting. Built from the final S28 tables and the S28 honours, with predicted positions from the published S28 stats and facts reviews. It replaces `s28-nominations-draft.md`.

## Method

- **Predicted positions** come from Mister TRX's S28 stats and facts reviews: the squads as they started the season. The live Sync prediction uses today's squads, which have changed since the season ended.
- **Value added** = predicted − final position.
- **Nomination score** = (21 − final position) + value added.
- **Each division:** the champion plus the three highest nomination scores. Ties go to the larger value added.
- **Overall:** the Division 1 champion plus the five highest scores in Top 100. Ties go to the larger value added.
- **Managers** are the S28 managers. Udinese (Frankland), Sevilla (TRX) and Sampdoria (Beddows) have changed hands since. At Benfica, Carlos Miranda managed 34 of the 38 games, from 12 July, and is credited with the title.
- **Admin team decisions (10 November):**
  - Managers who have left Top 100 aren't nominated. This covers the Top 100 Cup (Libras-Boas) and Top 100 Shield (Saviano) winners.
  - Lyon's squad-limit sanction doesn't rule Bruno Neto out.
  - Four nominees in each division.
  - Glen Mullan is added to the Overall award for Espanyol's third successive Youth Cup.

## Overall Manager of the Season

| Manager | Club | Final | Predicted | Value added | Achievement |
|---|---|---|---|---|---|
| André Guerra | FC Porto | D1 1st | 3rd | +2 | Division 1 champions and World Club Cup winners |
| Neil Frankland | Udinese Calcio | D2 2nd | 17th | +15 | Promoted, 15 places above prediction: the biggest overachievement in Top 100 |
| Chris East | PSV | D5 1st | 13th | +12 | Division 5 champions, 86 points |
| Bruno Neto | Olympique Lyonnais | D4 4th | 18th | +14 | Predicted to go down, finished in the play-off places |
| Chris Taylor | Atalanta BC | D5 3rd | 16th | +13 | Promoted, the biggest value added in Division 5 |
| Everton Luiz | Dnipro Dnipropetrovsk | D3 6th | 20th | +14 | Play-off places with the weakest squad in Division 3 |
| Glen Mullan | RCD Espanyol | D1 12th | 20th | +8 | Youth Cup winners for the third season running; a comfortable Division 1 survival with the weakest squad |

Next: Carlos Miranda (Benfica, score 29, +9).

## Division 1

| Manager | Club | Final | Predicted | Value added | Achievement |
|---|---|---|---|---|---|
| André Guerra | FC Porto | 1st | 3rd | +2 | Division 1 champions and World Club Cup winners |
| Ash L | Leicester City | 3rd | 7th | +4 | Third, four places above prediction; SMFA Champions Cup and SMFA Super Cup |
| Bojan H | Bayern München | 5th | 9th | +4 | Fifth, four places above prediction |
| Heath Brown | Arsenal | 8th | 13th | +5 | Eighth, five places above prediction |

Next: James Mckenzie (Chelsea, 2nd, Charity Shield; score 18, −1) and Glen Mullan (Espanyol, 12th with the weakest squad, +8, Youth Cup; score 17).

## Division 2

| Manager | Club | Final | Predicted | Value added | Achievement |
|---|---|---|---|---|---|
| Carlos Miranda | SL Benfica | 1st | 10th | +9 | Division 2 champions after taking over in July |
| Neil Frankland | Udinese Calcio | 2nd | 17th | +15 | Promoted, 15 places above prediction |
| ⍟Greg Bilboaツ | West Bromwich Albion | 3rd | 8th | +5 | Promoted |
| Mister TRX | Sevilla FC | 6th | 13th | +7 | Seven places above prediction, a season after promotion |

Next: Steven Allington (Cruzeiro) and Marco G (Leverkusen), score 17. Play-off winners Frank Hirst (Genoa, −6) and SMFA Shield winners Andrew Kelly (Stoke, −5) are not nominated.

## Division 3

| Manager | Club | Final | Predicted | Value added | Achievement |
|---|---|---|---|---|---|
| Sir Stephen Beddows | Sampdoria | 1st | 7th | +6 | Division 3 champions |
| Everton Luiz | Dnipro Dnipropetrovsk | 6th | 20th | +14 | Play-off places with the weakest squad |
| Alessandro Ioli | Ajax | 2nd | 9th | +7 | Promoted for the second season running |
| JWD | Málaga CF | 11th | 19th | +8 | Eleventh with the second-weakest squad |

Next, on score 18: Kevin Trapp (Southampton, +7), Pedro Vilar (Tottenham, +6), rOsS fAlCOn3r (Lille, +5) and Anthony Guardiola (Hoffenheim, +1). Play-off winners Jay Jones (Monaco, −1) are not nominated.

## Division 4

| Manager | Club | Final | Predicted | Value added | Achievement |
|---|---|---|---|---|---|
| Alessio Tonato | SSC Napoli | 1st | 1st | 0 | Division 4 champions, 82 points |
| Bruno Neto | Olympique Lyonnais | 4th | 18th | +14 | Predicted to go down, finished in the play-off places |
| Pane Trifunov | River Plate | 8th | 17th | +9 | Predicted to go down, nine places above prediction |
| yamil Mc02 | Beşiktaş JK | 6th | 13th | +7 | Play-off winners, promoted |

Next: Melvin Udall (Werder Bremen, 7th, +7, score 21).

## Division 5

| Manager | Club | Final | Predicted | Value added | Achievement |
|---|---|---|---|---|---|
| Chris East | PSV | 1st | 13th | +12 | Division 5 champions, 86 points |
| Chris Taylor | Atalanta BC | 3rd | 16th | +13 | Promoted, the biggest value added in Division 5 |
| Mohammed Ajmal | AZ Alkmaar | 2nd | 11th | +9 | Promoted |
| Mark Deadman | Shakhtar Donetsk | 5th | 17th | +12 | Play-off places, twelve above prediction |

Next: Luciano Catalano (Sassuolo, play-off winners, +8, score 22).

## Loading into Shared Voting

One `awards` event with six questions (Overall, Divisions 1–5). Each nominee is a `voting_options` row whose `metadata` holds `club`, `achievement` (the column above) and a one-line `description` (see `docs/shared-voting-v2-adapter.md`).
