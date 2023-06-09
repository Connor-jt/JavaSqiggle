# Web-game
(rename to JavaSqiggle upon completion)
current site test link: https://connor-jt.github.io/Web-game/

my first javascript project, a simple multiplayer web game
designed as a sort of modernization of chess, where it would resemble physical board game experiences, yet leveraging the potentail of digital technology 
some examples of this would be: non-constant stats per unit, infinite board size, infinite count of pieces, resources, players etc

the goal of the game is to dominate the board, wherein depending on the gamemode:
elimiting all opposing player's pieces
controlling all objective points
capturing and delivering a variable amount of objectives (like ctf?)

and including alternate versions of each objective where players are assorted into teams

in this game there are 4 pieces:
the worker - allows construction of other pieces, not useful in combat but does have good stats for keeping a lookout
the soldier - core assault piece, featuring an equal moderate-range in movement and attack, this piece should excell at assaulting opposing pieces
the sniper - area denial, this piece's high attack range allows it to keep other pieces away from a location, its low movement range makes it not ideal for attacking however
the tower - general purpose defense unit, with very high defense and low movement range, this piece would be better suited for defending locations

each piece would have a respective cost to create, the cost being higher, lower into the list (so the worker is the cheapest, and the tower the most expensive)
if a player has no workers left, then they will be unable to create new pieces normally, they will have to rely on the option of creating a new worker (note that you can create new workers with an existing worker)
this would be a last resort option for if a player had their operating base with all their workers elimited, but they still have resources (or have an opportunity to acquire more)
then they could continue developing assualts and potentially make a comeback to win the game, likely this will be a game setting that you can configure 

for each piece they will have these attributes:
defense - the amount of overall attack points required to eliminate this piece, it will deminish each time the piece is attacked
attack - the amount of attack points a piece will do upon attacking another
movement range - the amount of tiles that a piece can move in any (of the hexagonal) directions per turn 
attack range - the amount of tiles range that a piece can attack another in
visibility range - this is the distance that a piece can see, if you cannot see a tile then you cannot tell what or who is on it

as for the turn system, players take turns synchronously, being given an allocated amount of time to plot all moves for that turn
each player makes their moves and can then either submit them early, or wait until the round time is up, default round time will be about 30 seconds
to assist with the problem of having too many pieces to plot moves for each turn, there will probably be a move until functionality,
where players can tell their piece to keep moving until it reaches this destination
which will essentially plot out the next closest tile for that piece to move to (in its movement range) each turn, until it reaches it

pieces will beable to make 1 or 3 moves each turn
1. move to tile
2. attack piece at tile - if there is an enemy piece at this tile (in range of the selected unit), than the unit may attack it
3. create piece at tile (only workers) - workers can consume resources to create a new piece within their visbility range

dependancies used:
PeerJS for webRTC connections for the peer to peer network system
Three.js for the simplified openGL workflow (including a modified orbital controls plugin)
simplex-noise.js for the noise generation system
and some code sourced from github for a seedable random number generator: https://stackoverflow.com/questions/521295/seeding-the-random-number-generator-in-javascript/47593316#47593316
