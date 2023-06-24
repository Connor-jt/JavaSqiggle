# JavaSqiggle
current access link: https://connor-jt.github.io/Web-game/

my first javascript project, a simple multiplayer web game

designed as a sort of evolution of chess (athough is notably more simple than chess due to project scope), 
where it would sorta resemble a physical board game, yet having a much larger scale with infinite amounts of pieces

the objective of this game is to dominate the playspace, capturing the objective points and then eliminating the opposing players

in this game there are 4 pieces:
- the worker - allows construction of pieces, low stats but a solid unit for the low cost
- the soldier - area assault, with moderate stats and a high movement speed, its good for taking over objectives and hunting other units
- the sniper - area denial, with a high range, low damage and moderate speed, is a solid support unit
- the tower - area defense, with very high defense and low movement range, its very good at holding areas

each piece has a respective cost to create, increasing as the list descends (so the worker is the cheapest, and the tower the most expensive)

if a player has no workers left, then they can place in any known position but at a higher cost (this is essentially a last resort option to allow players to play on, given they have the resources)

for each piece they will have these attributes:
- defense - the attack points required to eliminate a piece, deminishing each time the piece is attacked
- attack - the attack points dealt when attacking a piece
- movement range - the distance that a piece can move each turn
- attack range - the distance that a piece can attack within
- visibility range - the distance that a piece can reveal tiles within

players take turns synchronously, where theres X (default ~15) seconds of time for each player to plot their moves, before the server processes them

upon processing the moves, the server will send back the approved moves to each player as needed, then the turn is completed and the next turn begins

each turn, each pieces will beable to either:
- move to tile (in range)
- attack piece (in range)
  
to assist with the problem of managing large sets of pieces, you can apply preset behaviours individually to your pieces (or to all of them at once)
- default - no behaviour
- roam - the unit will pick random nearby destionations to move towards
- play - the unit will focus on either going to the closest objective or attacking the closest enemy piece

there is also the global attack mode, when activted: will cause pieces to automatically make any attacks that they possibly can, and they will automatically pick these moves at the beginning of the round

as well, there are unit movement behaviours which include
- goto - the piece will keep moving until it reaches the destination
- follow - the piece will continue to make the closest moves to the target, and if hostile the piece will attack

lastly, there is of course the piece creation. where you can use up your resources to put new pieces onto the play space


# Controls
Movement controls
- scroll : zoom in/out
- hold scroll : rotate camera
- click + alt : move camera (not exclusive to this combination, however the other camera movement inputs have other effects)

Placement controls 
- 1 : place worker piece
- 2 : place soldier piece
- 3 : place sniper piece
- 4 : place tower piece

Piece behaviours controls
- 7 : default mode for selected unit
- 8 : roam mode for selected unit
- 9 : aggressive mode for selected unit
- ctrl + 7 : default mode for all units
- ctrl + 8 : roam mode for all units
- ctrl + 9 : aggressive mode for all units
- 0 : enable/disable auto attack mode for all units

Piece interaction controls
- backspace : clear modes and modes for selected unit
- space : select or deselect unit

Interaction controls (with corresponding cursor style indicators)
- [auto]      click :                         interact with tile
- [help/auto] click + known/unknown tile :    move the camera
- [pointer]   click + owned piece :           select piece
- [move]      click + piece movement tile :   queue the piece to move there
- [????]      click + piece range tile :      (no effect other than) move the camera
- [alias]     click + in-range hostile unit : queue the piece to attack
- [blocked]   click + hostile unit :          (no effect other than) move the camera

Advanced interaction controls
- [resize vert] click + ctrl + selected piece + any tile :       goto here
- [crosshair]   click + ctrl + selected piece + hostile piece :  chase them
- [cell]        click + ctrl + selected piece + friendly piece : follow them

#Dependencies
- PeerJS for webRTC connections for the peer to peer network system
- Three.js for the simplified openGL workflow (including a modified orbital controls plugin)
- simplex-noise.js for the noise generation system
- and some code sourced from github for a seedable random number generator: https://stackoverflow.com/questions/521295/seeding-the-random-number-generator-in-javascript/47593316#47593316
