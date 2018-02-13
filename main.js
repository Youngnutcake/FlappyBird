var game_status = { begin: 0, run: 1, end: 2 }
var start_score = false

var bird = function (key, g) {
    var imgs = [
        'images/0bird.png',
        'images/1bird.png',
        'images/0bird.png',
        'images/2bird.png',
    ]

    var animations = []

    for(var img of imgs) {
        var i = new Image()
        i.src = img
        animations.push(i)
    }

    var b = {
        key: key,
        x: 50,
        y: 250,
        speed: 0,
        frame_count: 3,
        img_idx: 0,
        flipX: false,
        rotation: 0,
    }

    b.update = function () {
        --this.frame_count
        if (this.frame_count == 0) {
            this.frame_count = 3
            this.img_idx = (++this.img_idx) % animations.length
        }

        //纵向速度
        b.speed += 0.2
        b.y += b.speed

        //角度
        if (this.rotation < 45) {
            this.rotation += 5
        }
        if (b.y > 400) {
            g.status = game_status.end
        }
    }

    var width = 40
    var height = 30
    b.draw = function () {
        var context = g.context
        var w2 = width / 2
        var y2 = height / 2
        context.save()
        context.translate(this.x + w2, this.y + y2)
        if (this.flipX) {
            context.scale(-1, 1)
        }
        context.rotate(this.rotation * Math.PI / 180)
        context.translate(-w2, -y2)
        context.drawImage(animations[this.img_idx], 0, 0)
        context.restore()
        return

        g.draw(animations[this.img_idx], this.x, this.y)
    }

    g.addElement(b.key, b)

    g.register('k', function () { /* ArrowUp/ArrowDown */
        b.rotation = -45
        b.y -= 10
        b.speed = 0
    })

    g.register('ArrowLeft', function () { /* ArrowUp/ArrowDown */
        b.flipX = true
    })

    g.register('ArrowRight', function () { /* ArrowUp/ArrowDown */
        b.flipX = false
    })

    return b
}

var pipe = function (key, xx, g) {
    var imgs = {
        pipe_s: 'images/pipe-south.png',
        pipe_n: 'images/pipe-north.png',
    }

    var pipe_s = new Image()
    pipe_s.src = imgs.pipe_s
    var pipe_n = new Image()
    pipe_n.src = imgs.pipe_n

    var p = {
        key: key,
        x: xx,
        y_s: -200,
        y_n: 150,
        speed: 0,
    }

    var y_s_start = -400, y_n_start = 150

    p.update = function () {
        p.x -= 5
    }

    p.draw = function () {
        g.draw(pipe_s, p.x, p.y_s)
        g.draw(pipe_n, p.x, p.y_n)
    }

    p.random_y = function () {
        var random = Math.random()
        var dy = Math.floor(250 * random)
        this.y_s = y_s_start + dy
        this.y_n = y_n_start + dy
    }

    return p
}

var pipe_manager = function (key, g) {
    var pipes = []
    for (var i = 0; i < 3; ++i) {
        var p = pipe(`pipe1${i}`, 500 + 216 * i, game)
        p.random_y()
        pipes.push(p)
    }
    var p = {
        key: key,
        pipes: pipes,
    }

    p.update = function () {
        for (var i = 0; i < this.pipes.length; ++i) {
            var pipe = this.pipes[i]
            pipe.update()
            if (pipe.x < -66) {
                pipe.x = this.pipes[(i + this.pipes.length - 1) % this.pipes.length].x + 216
                pipe.random_y()
            }
        }
        if (!start_score) {
            var bird = g.objs[g.objs.findIndex(x=>x.key == 'bird')]
            if (bird.x + 40 > p.pipes[0].x) {
                start_score = true
                g.scoreadd()
            }
        }
    }

    p.draw = function () {
        for(var pipe of this.pipes) {
            pipe.draw()
        }
    }

    g.addElement(p.key, p)
}

var score_manager = function (g) {
    var imgs_src = ['images/0.png', 'images/1.png', 'images/2.png', 'images/3.png', 'images/4.png',
        'images/5.png', 'images/6.png', 'images/7.png', 'images/8.png', 'images/9.png']
    var imgs = []
    for(var source of imgs_src) {
        var tmp = new Image()
        tmp.src = source
        imgs.push(tmp)
    }

    var s = {}
    s.draw = function () {
        var str = g.score.toString()
        for (var i = 0; i < str.length; ++i) {
            g.draw(imgs[str[i] - '0'], 5 + 25 * i, 0)
        }
    }

    g.addElement('score', s)
    return s
}

var game = function () {
    var c = document.getElementById("id-canvas")
    var ctx = c.getContext("2d")

    var g = {
        keydowns: {},
        actions: {},
        objs: [],
        images: {
            bg: 'images/background.png',
            fg: 'images/foreground.png',
            start: 'images/message.png',
        },
        status: game_status.begin,
        context: ctx,
        score: 0,
    }

    var img_bg = new Image()
    img_bg.src = g.images.bg
    var img_fg = new Image()
    img_fg.src = g.images.fg
    var start_png = new Image()
    start_png.src = g.images.start

    window.addEventListener('keydown', function (event) {
        g.keydowns[event.key] = "down"
        if (event.key == 's') {
            g.status = game_status.run
        }
    })
    window.addEventListener('keyup', function (event) {
        g.keydowns[event.key] = "up"
    })

    g.register = function (key, callback) {
        g.actions[key] = callback
    }

    g.addElement = function (key, obj) {
        g.objs.push(obj)
    }

    g.removeElement = function (key) {
        g.objs.splice(g.objs.findIndex(item => item.key === key), 1)
    }

    g.draw = function (img, x, y) {
        ctx.drawImage(img, x, y)
    }

    //碰撞检查
    function checkhit(g) {
        var bird = g.objs[g.objs.findIndex(x=>x.key == 'bird')]
        var manager = g.objs[g.objs.findIndex(x=>x.key == 'manager1')]
        for(p of manager.pipes) {
            if (!(bird.x < p.x || bird.x > (p.x + 66) || (bird.y > p.y_s + 400 && bird.y < p.y_n))) {
                g.status = game_status.end
            }
        }
    }

    //用于控制底部草坪循环移动
    var img_fg_x = 0

    g.mainloop = function () {

        ctx.clearRect(0, 0, c.width, c.height)
        g.draw(img_bg, 0, 0)

        if (g.status == game_status.begin) {
            g.draw(start_png, 108, 116)
        }
        else if (g.status == game_status.end) {
            alert("you lose")
            start_score = false
            g.score = 0
            g.removeElement('bird')
            g.removeElement('manager1')
            b = bird('bird', game)
            pipes_manager = pipe_manager('manager1', game)

            g.status = game_status.begin
        }
        else {
            var actions = Object.keys(g.actions)
            for (let i = 0; i < actions.length; ++i) {
                if (this.keydowns[actions[i]] == 'down') {
                    this.actions[actions[i]]()
                }
            }

            for (let i = 0; i < this.objs.length; ++i) {
                if (this.objs[i].update != undefined)
                    this.objs[i].update()
            }

            for (let i = 0; i < this.objs.length; ++i) {
                if (this.objs[i].draw != undefined)
                    this.objs[i].draw()
            }
            if (img_fg_x < -100) img_fg_x = 0

            g.draw(img_fg, img_fg_x, 0)

            img_fg_x -= 5

            checkhit(g)
        }
        setTimeout(g.mainloop.bind(g), 1000 / 50)
    }

    g.scoreadd = function () {
        if (!start_score) {
            return
        }
        g.score++
        setTimeout(g.scoreadd.bind(g), 864)
    }
    return g
}()

var pipes_manager = pipe_manager('manager1', game)
var b = bird('bird', game)
var score = score_manager(game)
game.mainloop()