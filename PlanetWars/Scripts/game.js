var Assets = {
    TextureFleets: new ex.Texture("/Content/Images/spaceship.png")
};
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var Chart = (function (_super) {
    __extends(Chart, _super);
    function Chart() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Chart.prototype.update = function (engine, delta) {
        _super.prototype.update.call(this, engine, delta);
    };
    Chart.prototype.draw = function (ctx, delta) {
        _super.prototype.draw.call(this, ctx, delta);
        this._drawLine(ctx, GameSession.State.playerAScoreOverTime, Config.PlayerAColor);
        this._drawLine(ctx, GameSession.State.playerBScoreOverTime, Config.PlayerBColor);
    };
    Chart.prototype._drawLine = function (ctx, scores, color) {
        var brush = new ex.Point(0, this.getHeight());
        var step = 0, stepWidth = this.getWidth() / Math.max(35, GameSession.State.currentTurn);
        var yMax = _.sum(_.map(GameSession.State.fleets, function (x) { return x.numberOfShips; })) +
            _.sum(_.map(GameSession.State.planets, function (x) { return x.numberOfShips; }));
        ctx.beginPath();
        ctx.strokeStyle = color.toString();
        ctx.lineWidth = 2;
        for (step; step < scores.length; step++) {
            brush.x = step * stepWidth;
            brush.y = this.getHeight() - ((scores[step] / yMax) * this.getHeight());
            ctx.lineTo(this.getBounds().left + brush.x, this.getBounds().top + brush.y);
        }
        ctx.stroke();
    };
    return Chart;
}(ex.Actor));
var Config = {
    MapPadding: 50,
    MapSize: 400,
    StarfieldSize: 1000,
    StarfieldMinFade: 0.2,
    StarfieldMaxFade: 0.7,
    StarfieldMinFadeRefreshAmount: 0.05,
    StarfieldMaxFadeRefreshAmount: 0.15,
    StarfieldRefreshRate: 300,
    StarfieldMeteorFreqMin: 2000,
    StarfieldMeteorFreqMax: 7000,
    StarfieldMeteorSpeed: 320,
    FleetWidth: 6,
    FleetHeight: 7,
    FleetAnimSpeed: 400,
    ChartWidth: 500,
    ChartHeight: 120,
    ChartOffsetY: 100,
    ChartBackground: ex.Color.fromRGB(255, 255, 255, 0.2),
    PlanetMinSize: 25,
    PlanetMaxSize: 120,
    PlanetNeutralColor: ex.Color.Gray,
    PlayerAColor: ex.Color.fromHex("#c53e30"),
    PlayerBColor: ex.Color.fromHex("#3797bf")
};
var Planet = (function (_super) {
    __extends(Planet, _super);
    function Planet(planet) {
        var _this = this;
        var p = GameSession.mapServerCoordsToWorld(planet.position);
        var s = GameSession.mapPlanetSize(planet.growthRate);
        _this = _super.call(this, p.x, p.y, s, s) || this;
        _this._planetColor = Config.PlanetNeutralColor;
        _this._initialShips = planet.numberOfShips;
        _this.updateState(planet);
        return _this;
    }
    Planet.prototype.getServerCoord = function () {
        return new ex.Point(this._planet.position.x, this._planet.position.y);
    };
    Planet.prototype.onInitialize = function (engine) {
        var _this = this;
        _super.prototype.onInitialize.call(this, engine);
        this._shipLabel = new ex.Label(null, 0, 0, 'Segoe UI Black, Verdana');
        this._shipLabel.fontSize = 14;
        this._shipLabel.color = ex.Color.White;
        this._shipLabel.textAlign = ex.TextAlign.Center;
        this._shipLabel.baseAlign = ex.BaseAlign.Middle;
        this.add(this._shipLabel);
        this.on('predraw', function (e) {
            _this.predraw(e.ctx, e.delta);
        });
    };
    Planet.prototype.updateState = function (planet) {
        this._planet = planet;
    };
    Planet.prototype.update = function (engine, delta) {
        _super.prototype.update.call(this, engine, delta);
        this._shipLabel.text = this._planet.numberOfShips.toString();
        if (this._planet.ownerId === GameSession.State.playerA) {
            this._planetColor = Config.PlayerAColor;
        }
        else if (this._planet.ownerId === GameSession.State.playerB) {
            this._planetColor = Config.PlayerBColor;
        }
        else {
            this._planetColor = Config.PlanetNeutralColor;
        }
    };
    Planet.prototype.predraw = function (ctx, delta) {
        ctx.beginPath();
        ctx.arc(0, 0, this.getWidth() / 2, 0, Math.PI * 2);
        ctx.fillStyle = this._planetColor.toString();
        ctx.closePath();
        ctx.fill();
    };
    return Planet;
}(ex.Actor));
var Fleet = (function (_super) {
    __extends(Fleet, _super);
    function Fleet(sp, dp, anim, ships) {
        var _this = _super.call(this, sp.x, sp.y, Config.FleetWidth, Config.FleetHeight) || this;
        _this._v1 = new ex.Vector(0, 0);
        _this._v2 = new ex.Vector(0, 0);
        _this.addDrawing('default', anim);
        _this._ships = ships;
        _this._dest = dp;
        var spsc = sp.getServerCoord();
        var dpsc = dp.getServerCoord();
        _this._turns = Math.ceil(Math.sqrt(Math.pow(dpsc.x - spsc.x, 2) +
            Math.pow(dpsc.y - spsc.y, 2)));
        return _this;
    }
    Fleet.create = function (fleet) {
        var sp = GameSession.getPlanet(fleet.sourcePlanetId);
        var dp = GameSession.getPlanet(fleet.destinationPlanetId);
        var ships = fleet.numberOfShips;
        if (!Fleet._sheet) {
            Fleet._sheet = new ex.SpriteSheet(Assets.TextureFleets, 4, 1, 12, 10);
        }
        var anim;
        if (fleet.ownerId === GameSession.State.playerA) {
            anim = Fleet._sheet.getAnimationBetween(GameSession.Game, 0, 1, Config.FleetAnimSpeed);
        }
        else {
            anim = Fleet._sheet.getAnimationBetween(GameSession.Game, 2, 3, Config.FleetAnimSpeed);
        }
        return new Fleet(sp, dp, anim, ships);
    };
    Fleet.prototype.onInitialize = function (engine) {
        var _this = this;
        _super.prototype.onInitialize.call(this, engine);
        this._fleetLabel = new ex.Label("" + this._ships, 0, 10, 'Arial');
        this._fleetLabel.color = ex.Color.White;
        this._fleetLabel.textAlign = ex.TextAlign.Center;
        this.add(this._fleetLabel);
        this._v1.x = this._dest.x;
        this._v1.y = this._dest.y;
        this._v2.x = this.x;
        this._v2.y = this.y;
        this.rotation = this._v1.subtract(this._v2).toAngle();
        this._fleetLabel.rotation = -this.rotation;
        this.moveBy(this._dest.x, this._dest.y, GameSession.getTurnDuration() * this._turns).asPromise().then(function () { return _this.kill(); });
    };
    return Fleet;
}(ex.Actor));
var GameSession = (function () {
    function GameSession() {
    }
    GameSession.create = function (gameId) {
        GameSession.Id = gameId;
        var game = new ex.Engine({
            canvasElementId: "game",
            displayMode: ex.DisplayMode.Container
        });
        game.backgroundColor = ex.Color.Black;
        var loader = new ex.Loader();
        _.forIn(Assets, function (a) { return loader.addResource(a); });
        game.start(loader).then(function (g) { return GameSession.init(); });
        GameSession.Game = game;
    };
    GameSession.init = function () {
        GameSession.Game.add(new Starfield());
        GameSession.updateSessionState().then(function () {
            GameSession._turnTimer = new ex.Timer(function () { return GameSession.updateSessionState(); }, GameSession.getTurnDuration(), true);
            GameSession.Game.add(GameSession._turnTimer);
            GameSession.Game.add(new Chart(GameSession.Game.getWidth() / 2, Config.ChartOffsetY, Config.ChartWidth, Config.ChartHeight, Config.ChartBackground));
        });
    };
    GameSession.mapPlanetSize = function (growthRate) {
        var sf = growthRate / _.max(_.map(GameSession.State.planets, function (p) { return p.growthRate; }));
        return ex.Util.clamp(sf * Config.PlanetMaxSize, Config.PlanetMinSize, Config.PlanetMaxSize);
    };
    GameSession.mapServerCoordsToWorld = function (p) {
        var px = _.map(GameSession.State.planets, function (k) { return k.position.x; });
        var py = _.map(GameSession.State.planets, function (k) { return k.position.y; });
        var pxMin = _.min(px);
        var pxMax = _.max(px);
        var pyMin = _.min(py);
        var pyMax = _.max(py);
        var sfx = p.x / pxMax;
        var sfy = p.y / pyMax;
        var x = (sfx * Config.MapSize);
        var y = (sfy * Config.MapSize);
        var vw = GameSession.Game.getWidth();
        var vh = GameSession.Game.getHeight();
        x = ((vw / 2) - (Config.MapSize / 2)) + x;
        y = ((vh / 2) - (Config.MapSize / 2)) + y;
        return new ex.Point(x, y);
    };
    GameSession.updateSessionState = function () {
        return $.post("/api/status", { gameId: GameSession.Id }).then(function (s) {
            GameSession.State = s;
            if (GameSession.State.currentTurn > 0) {
                $("#game-turns span").text(GameSession.State.currentTurn);
            }
            $("[data-id='1'] span").text(GameSession.State.playerAScore);
            $("[data-id='2'] span").text(GameSession.State.playerBScore);
            _.each(GameSession.State.planets, function (p) {
                var planet = new Planet(p);
                if (!GameSession._planets[p.id]) {
                    GameSession.Game.add(planet);
                    GameSession._planets[p.id] = planet;
                }
                else {
                    GameSession._planets[p.id].updateState(p);
                }
            });
            if (GameSession.State.isGameOver) {
                $("#game-over").show();
                $("#game-over span").text(GameSession.State.status);
                return;
            }
            _.each(GameSession.State.fleets, function (f) {
                var fleet = Fleet.create(f);
                if (!GameSession._fleets[f.id]) {
                    GameSession.Game.add(fleet);
                    GameSession._fleets[f.id] = fleet;
                }
            });
        });
    };
    GameSession.getPlanet = function (planetId) {
        if (!GameSession._planets[planetId]) {
            throw "Planet does not exist";
        }
        return GameSession._planets[planetId];
    };
    GameSession.getOwnerColor = function (ownerId) {
        if (ownerId == GameSession.State.playerA) {
            return Config.PlayerAColor;
        }
        if (ownerId == GameSession.State.playerB) {
            return Config.PlayerBColor;
        }
        return Config.PlanetNeutralColor;
    };
    GameSession.getTurnDuration = function () {
        return GameSession.State.playerTurnLength;
    };
    GameSession._planets = [];
    GameSession._fleets = [];
    return GameSession;
}());
var Starfield = (function (_super) {
    __extends(Starfield, _super);
    function Starfield() {
        var _this = _super.call(this, 0, 0, 0, 0) || this;
        _this._stars = [];
        return _this;
    }
    Starfield.prototype.onInitialize = function () {
        var _this = this;
        this.setWidth(GameSession.Game.getWidth());
        this.setHeight(GameSession.Game.getHeight());
        for (var i = 0; i < Config.StarfieldSize; i++) {
            this._stars.push({
                x: ex.Util.randomIntInRange(0, this.getWidth()),
                y: ex.Util.randomIntInRange(0, this.getHeight()),
                o: ex.Util.randomInRange(Config.StarfieldMinFade, Config.StarfieldMaxFade)
            });
        }
        this._fadeTimer = new ex.Timer(function () { return _this._updateFaded(); }, Config.StarfieldRefreshRate, true);
        this._meteorTimer = new ex.Timer(function () { return _this._shootMeteor(); }, ex.Util.randomIntInRange(Config.StarfieldMeteorFreqMin, Config.StarfieldMeteorFreqMax), true);
        GameSession.Game.add(this._fadeTimer);
        GameSession.Game.add(this._meteorTimer);
        this._updateFaded();
    };
    Starfield.prototype._updateFaded = function () {
        var totalFaded = Math.floor(this._stars.length *
            ex.Util.randomInRange(Config.StarfieldMinFadeRefreshAmount, Config.StarfieldMaxFadeRefreshAmount));
        for (var i = 0; i < totalFaded; i++) {
            this._stars[ex.Util.randomIntInRange(0, this._stars.length - 1)].o = ex.Util.randomInRange(Config.StarfieldMinFade, Config.StarfieldMaxFade);
        }
    };
    Starfield.prototype._shootMeteor = function () {
        var dest = new ex.Vector(ex.Util.randomInRange(0, this.getWidth()), ex.Util.randomIntInRange(50, this.getHeight() / 2));
        var meteor = new ex.Actor(ex.Util.randomIntInRange(0, this.getWidth()), 0, 2, 2, ex.Color.fromRGB(164, 237, 255, 1));
        meteor.moveBy(dest.x, dest.y, Config.StarfieldMeteorSpeed).asPromise().then(function () { return meteor.kill(); });
        GameSession.Game.add(meteor);
        this._meteorTimer.interval = ex.Util.randomIntInRange(Config.StarfieldMeteorFreqMin, Config.StarfieldMeteorFreqMax);
    };
    Starfield.prototype.draw = function (ctx, delta) {
        for (var i = 0; i < this._stars.length; i++) {
            ctx.fillStyle = ex.Color.fromRGB(255, 255, 255, this._stars[i].o).toString();
            ctx.fillRect(this._stars[i].x, this._stars[i].y, 1, 1);
        }
    };
    return Starfield;
}(ex.Actor));
//# sourceMappingURL=game.js.map