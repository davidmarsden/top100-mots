# S28 Manager of the Season: nominations

**Status:** final tables (38 of 38 games, Soccer Manager Sync, 10 November 2026) and S28 honours. This replaces `s28-nominations-draft.md` (35 games). For the admin team to confirm before loading into Shared Voting.

## Method

As in S27: champions, play-off winners, cup winners and the teams that did far better than their squads suggested.

- **Value added** = predicted position − final position. The prediction ranks each squad's strength within its division (Stats & History ETOT, end-of-season squad).
- **Nomination score** = (21 − final position) + value added. It picks the overachievers alongside the champions and play-off winners.
- **Overall:** the Division 1 champion plus the five highest nomination scores in Top 100.
- **Managers** are the S28 managers, not today's: Udinese (Frankland), Sevilla (TRX) and Sampdoria (Beddows) have changed hands since the season ended. The only mid-season change among the nominees is at Benfica. Gregg Robinson managed 4 games, then Carlos Miranda managed 34 (61 of the 70 points) from 12 July, so the title nomination is Miranda's.

## Overall Manager of the Season

| Manager | Club | Final | Predicted | Value added | Achievement |
|---|---|---|---|---|---|
| André Guerra | FC Porto | D1 1st | 10th | +9 | Division 1 champions, 87 points |
| Chris East | PSV | D5 1st | 19th | +18 | Division 5 champions with the division's second-weakest squad: 86 points, the biggest overachievement in Top 100 |
| Alessandro Ioli | Ajax | D3 2nd | 16th | +14 | Promoted for the second season running |
| Sir Stephen Beddows | Sampdoria | D3 1st | 12th | +11 | Division 3 champions |
| Ash L | Leicester City | D1 3rd | 15th | +12 | Third in Division 1 with a bottom-six squad; SMFA Champions Cup and SMFA Super Cup |
| Chris Taylor | Atalanta BC | D5 3rd | 15th | +12 | Promoted from Division 5 |

Next: Tommaso Mello (Boca Juniors, D3 5th, +13, score 29).

## Division 1

| Manager | Club | Final | Predicted | Value added | Achievement |
|---|---|---|---|---|---|
| André Guerra | FC Porto | 1st | 10th | +9 | Division 1 champions, 87 points |
| Ash L | Leicester City | 3rd | 15th | +12 | Third with a bottom-six squad; SMFA Champions Cup and Super Cup |
| James Mckenzie | Chelsea | 2nd | 5th | +3 | Runners-up as defending champions; Charity Shield |
| Carl Martin | Sporting CP | 7th | 13th | +6 | Seven places above prediction; Youth Shield winners |
| Glen Mullan | RCD Espanyol | 12th | 20th | +8 | Survived comfortably with the weakest squad; Youth Cup winners for the third season running |

## Division 2

| Manager | Club | Final | Predicted | Value added | Achievement |
|---|---|---|---|---|---|
| Carlos Miranda | SL Benfica | 1st | 7th | +6 | Division 2 champions after taking over in July |
| Neil Frankland | Udinese Calcio | 2nd | 10th | +8 | Promoted |
| Mister TRX | Sevilla FC | 6th | 15th | +9 | Nine places above prediction, a season after promotion |
| Frank Hirst | Genoa CFC | 7th | 1st | −6 | Play-off winners, promoted |
| Andrew Kelly | Stoke City | 8th | 3rd | −5 | SMFA Shield winners |

## Division 3

| Manager | Club | Final | Predicted | Value added | Achievement |
|---|---|---|---|---|---|
| Sir Stephen Beddows | Sampdoria | 1st | 12th | +11 | Division 3 champions |
| Alessandro Ioli | Ajax | 2nd | 16th | +14 | Promoted for the second season running |
| Tommaso Mello | Boca Juniors | 5th | 18th | +13 | Play-off places with a bottom-three squad |
| Everton Luiz | Dnipro Dnipropetrovsk | 6th | 19th | +13 | Play-off places with the second-weakest squad |
| Jay Jones | AS Monaco | 7th | 8th | +1 | Play-off winners, promoted (play-off winners in Division 4 last season too) |

## Division 4

| Manager | Club | Final | Predicted | Value added | Achievement |
|---|---|---|---|---|---|
| Alessio Tonato | SSC Napoli | 1st | 6th | +5 | Division 4 champions, 82 points |
| Melvin Udall | Werder Bremen | 7th | 20th | +13 | Seventh with the weakest squad in the division |
| Bruno Neto | Olympique Lyonnais | 4th | 13th | +9 | Promotion places (see the compliance note) |
| Pane Trifunov | River Plate | 8th | 16th | +8 | Eight places above prediction |
| yamil Mc02 | Beşiktaş JK | 6th | 11th | +5 | Play-off winners, promoted |

## Division 5

| Manager | Club | Final | Predicted | Value added | Achievement |
|---|---|---|---|---|---|
| Chris East | PSV | 1st | 19th | +18 | Division 5 champions, 86 points, with the second-weakest squad |
| Chris Taylor | Atalanta BC | 3rd | 15th | +12 | Promoted |
| Mohammed Ajmal | AZ Alkmaar | 2nd | 8th | +6 | Promoted |
| Mark Deadman | Shakhtar Donetsk | 5th | 11th | +6 | Promotion places, six above prediction |
| Luciano Catalano | US Sassuolo | 7th | 12th | +5 | Play-off winners, promoted |

## Decisions for the admin team

1. **Top 100 Cup and Top 100 Shield.** Won by Luís André Libras-Boas (Hellas Verona) and Dario Saviano (Borussia Dortmund), who have both left Top 100. Not nominated above; add them if the team wants cup winners recognised regardless.
2. **Olympique Lyonnais (Bruno Neto).** Sanctioned on 19 October for the squad-limit breach (rule 4.1). Decide whether a sanction rules a manager out of the awards.
3. **World Club Cup.** No S28 result in the records. Add the winner if it was played.
4. **Nominees per category.** Five in each division and six overall (S27 had two to six). Trim if the team prefers four.

## Loading into Shared Voting

One `awards` event with six questions (Overall, Divisions 1–5). Each nominee is a `voting_options` row whose `metadata` holds `club`, `achievement` (the column above) and a one-line `description` (see `docs/shared-voting-v2-adapter.md`).
