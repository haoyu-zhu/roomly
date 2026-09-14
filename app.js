/* ===== 同屋 Roomly · 合租生活管家 · 原型逻辑 ===== */
(function () {
  'use strict';

  var LS = 'roomly.v2';
  var SEEN = 'roomly.seen.v1';
  var WD = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  var now = new Date();
  var M = now.getMonth() + 1;
  var todayNum = now.getDay() === 0 ? 7 : now.getDay(); // 1=周一 … 7=周日

  /* ---------- 种子数据 ---------- */
  function seed() {
    var d = function (n) { return M + '月' + n + '日'; };
    return {
      room: { name: '望京·南湖东园 4室1厅', since: 186, rule: 0.75 },
      me: 'u1',
      members: [
        { id: 'u1', name: '我', real: '张扬', color: '#3A342E', room: '主卧·朝南', factor: 1.25, days: 30, coins: 111 },
        { id: 'u2', name: '小林', color: '#4C7A63', room: '次卧 A', factor: 1.0, days: 30, coins: 138 },
        { id: 'u3', name: '阿哲', color: '#5E5872', room: '次卧 B', factor: 0.95, days: 30, coins: 72 },
        { id: 'u4', name: 'Mia', color: '#8A6A43', room: '北卧', factor: 0.8, days: 26, coins: 60 }
      ],
      credit: { u1: 0, u2: 0, u3: 0, u4: 0 },
      bills: [
        mk('b1', '🏠', '房租', M + ' 月房租', 8600, 'u2', 'room', d(1), { u1: 1, u2: 1, u3: 1, u4: 1 }),
        mk('b2', '💡', '水电燃气', M + ' 月水电燃气', 312.4, 'u1', 'days', d(8), { u2: 1 }),
        mk('b3', '📶', '宽带', '宽带年费续费', 1188, 'u3', 'even', d(3), { u1: 1, u4: 1 }),
        mk('b4', '🧺', '日用品', '公共物资采购（抽纸·洗洁精·垃圾袋）', 86.5, 'u1', 'even', d(6), {}),
        mk('b5', '🍲', '餐饮', '周末火锅（3 人）', 268, 'u4', 'picked', d(7), {}, ['u1', 'u2', 'u4']),
        mk('b6', '🔧', '维修', '卫生间换灯 + 通下水', 120, 'u2', 'even', d(9), { u3: 1 })
      ],
      tasks: [
        { id: 't1', name: '倒垃圾', emoji: '🗑️', min: 5 },
        { id: 't2', name: '客厅扫地拖地', emoji: '🧹', min: 20 },
        { id: 't3', name: '厨房台面与灶台', emoji: '🍳', min: 15 },
        { id: 't4', name: '卫生间深度清洁', emoji: '🚿', min: 25 },
        { id: 't5', name: '阳台与玄关整理', emoji: '🪴', min: 10 }
      ],
      // day: 1=周一 … 7=周日
      shifts: [
        { id: 'a1', t: 't1', u: 'u1', day: 1 }, { id: 'a2', t: 't1', u: 'u2', day: 2 },
        { id: 'a3', t: 't1', u: 'u3', day: 3 }, { id: 'a4', t: 't1', u: 'u4', day: 4 },
        { id: 'a5', t: 't1', u: 'u1', day: 5 }, { id: 'a6', t: 't1', u: 'u2', day: 6 },
        { id: 'a7', t: 't1', u: 'u3', day: 7 },
        { id: 'a8', t: 't3', u: 'u2', day: 2 },
        { id: 'a9', t: 't2', u: 'u4', day: 3 },
        { id: 'a10', t: 't5', u: 'u4', day: 5 },
        { id: 'a11', t: 't2', u: 'u3', day: 6 },
        { id: 'a12', t: 't4', u: 'u1', day: 7 }
      ],
      supplies: [
        { id: 's1', name: '抽纸 / 厨房纸', emoji: '🧻', stock: 15, cycle: 30, by: 'u3', on: '8月28日', price: 39 },
        { id: 's2', name: '垃圾袋', emoji: '🛍️', stock: 22, cycle: 45, by: 'u1', on: '8月15日', price: 26 },
        { id: 's3', name: '洗洁精 / 钢丝球', emoji: '🧴', stock: 68, cycle: 60, by: 'u2', on: '8月30日', price: 19.9 },
        { id: 's4', name: '洗手液', emoji: '🧼', stock: 45, cycle: 50, by: 'u1', on: '8月2日', price: 29 },
        { id: 's5', name: '卫生间清洁剂', emoji: '🧽', stock: 80, cycle: 90, by: 'u4', on: M + '月1日', price: 35 },
        { id: 's6', name: '灯泡 / 五金杂物', emoji: '💡', stock: 60, cycle: 180, by: 'u2', on: '7月20日', price: 48 }
      ],
      buyTurn: 'u4',
      pacts: [
        { id: 'p1', cat: '访客', title: '过夜访客与水电分摊', text: '访客留宿每月合计不超过 4 晚。连续留宿超过 3 晚的，当月水电燃气按「多一个人」计入在住天数重新分摊，由留宿方承担。', on: '3月8日', vote: '4/4' },
        { id: 'p2', cat: '噪音', title: '安静时段', text: '23:30 – 07:30 为安静时段：客厅不外放音响、不启动洗衣机、通话请回房间。周五周六顺延至 00:30。', on: '3月8日', vote: '4/4' },
        { id: 'p3', cat: '清洁', title: '厨房即用即清', text: '使用厨房后 30 分钟内清理台面与水槽，锅具当次洗净。超时由管家统一提醒一次，当周计 1 次记录，不点名到个人群聊。', on: '4月2日', vote: '3/4' },
        { id: 'p4', cat: '费用', title: '账单确认与结清时限', text: '账单发布后 72 小时内确认，逾期视为默认通过；每月 10 日为结清截止日。超期未结清的，由管家自动推送提醒，不显示发起人。', on: '3月8日', vote: '4/4' },
        { id: 'p5', cat: '退租', title: '退租与押金结算', text: '退租需提前 30 天告知。押金扣减以公共区域实际损坏的维修单据为准；公共物资按剩余余量折价退还给已垫付方。', on: '3月8日', vote: '4/4' }
      ],
      votes: [
        { id: 'v1', cat: '清洁', title: '冰箱分区与过期清理', text: '冰箱按人划分固定层格，每月最后一个周日集体清理过期食品。超过保质期的公共食材，由最后一次购买人负责处理。', by: 'u2', yes: ['u2', 'u4'], no: [] },
        { id: 'v2', cat: '费用', title: '空调电费单独计量', text: '夏季（6–9 月）各房间空调用电按房间独立电表计量，各付各的；公共区域空调仍按在住天数分摊。', by: 'u3', yes: ['u3'], no: ['u2'] }
      ],
      records: [
        { id: 'r1', p: '厨房即用即清', u: 'u3', on: M + '月4日' },
        { id: 'r2', p: '账单确认与结清时限', u: 'u4', on: M + '月2日' }
      ],
      tab: 'home'
    };
  }

  function mk(id, emoji, cat, title, amount, payer, method, date, paid, picked) {
    return { id: id, emoji: emoji, cat: cat, title: title, amount: amount, payer: payer, method: method, date: date, paid: paid || {}, picked: picked || null };
  }

  /* ---------- 状态 ---------- */
  var S;
  try { S = JSON.parse(localStorage.getItem(LS)) || seed(); } catch (e) { S = seed(); }
  if (!S.bills) S = seed();
  // 补齐历史数据：早于今天的值日自动标记完成
  S.shifts.forEach(function (s) { if (s.done === undefined) s.done = s.day < todayNum; });
  // 让当前用户今天一定有一项值日（与原负责人对调，全周工作量总量不变）
  function ensureTodayTask() {
    var mine = S.shifts.filter(function (s) { return s.day === todayNum && s.u === S.me; });
    if (mine.length) return;
    var t = S.shifts.filter(function (s) { return s.day === todayNum; })[0];
    if (!t) return;
    var back = S.shifts.filter(function (s) { return s.u === S.me && s.t === t.t && s.day !== todayNum; })[0];
    var orig = t.u;
    t.u = S.me;
    if (back) back.u = orig;
  }
  ensureTodayTask();

  function save() { try { localStorage.setItem(LS, JSON.stringify(S)); } catch (e) { } }
  function mem(id) { for (var i = 0; i < S.members.length; i++) if (S.members[i].id === id) return S.members[i]; return { name: '?', color: '#999' }; }
  function task(id) { for (var i = 0; i < S.tasks.length; i++) if (S.tasks[i].id === id) return S.tasks[i]; return {}; }
  function isMe(id) { return id === S.me; }
  function nm(id) { return isMe(id) ? '我' : mem(id).name; }

  /* ---------- 工具 ---------- */
  function yuan(n) {
    var s = (Math.round(n * 100) / 100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return '¥' + s;
  }
  function y0(n) { return '¥' + Math.round(n).toLocaleString('zh-CN'); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function avatar(id, cls) {
    var m = mem(id);
    return '<span class="av ' + (cls || '') + '" style="background:' + m.color + '">' + esc(m.name.slice(0, 1)) + '</span>';
  }
  function $(id) { return document.getElementById(id); }

  /* ---------- 分摊计算 ---------- */
  var METHODS = {
    even: { name: '均摊', sub: '每人一样' },
    days: { name: '按在住天数', sub: '中途搬入搬出' },
    room: { name: '按房间系数', sub: '主次卧不同价' },
    picked: { name: '指定成员', sub: '只算相关的人' },
    custom: { name: '自定义金额', sub: '逐人填写' }
  };

  function splitOf(bill) {
    var ids = bill.method === 'picked' ? (bill.picked || []) : S.members.map(function (m) { return m.id; });
    var w = {}, total = 0;
    ids.forEach(function (id) {
      var m = mem(id), v = 1;
      if (bill.method === 'days') v = m.days;
      else if (bill.method === 'room') v = m.factor;
      w[id] = v; total += v;
    });
    var out = {}, acc = 0;
    if (bill.method === 'custom' && bill.custom) {
      S.members.forEach(function (m) { if (bill.custom[m.id]) out[m.id] = bill.custom[m.id]; });
      return out;
    }
    ids.forEach(function (id, i) {
      if (i === ids.length - 1) out[id] = Math.round((bill.amount - acc) * 100) / 100;
      else { var v = Math.round(bill.amount * w[id] / total * 100) / 100; out[id] = v; acc += v; }
    });
    return out;
  }

  /* ---------- 债务与最优结清 ---------- */
  function debts() { // 未结清的逐笔欠款
    var out = [];
    S.bills.forEach(function (b) {
      var sp = splitOf(b);
      Object.keys(sp).forEach(function (uid) {
        if (uid === b.payer || b.paid[uid]) return;
        out.push({ from: uid, to: b.payer, amount: sp[uid], bill: b.id });
      });
    });
    return out;
  }
  function nets() {
    var n = {};
    S.members.forEach(function (m) { n[m.id] = 0; });
    debts().forEach(function (d) { n[d.from] -= d.amount; n[d.to] += d.amount; });
    S.members.forEach(function (m) { n[m.id] += (S.credit[m.id] || 0); });
    return n;
  }
  // 债务图简化：贪心匹配最大债权人与最大债务人，得到最少转账笔数
  function plan() {
    var n = nets(), cred = [], deb = [];
    Object.keys(n).forEach(function (id) {
      if (n[id] > 0.009) cred.push({ id: id, v: n[id] });
      else if (n[id] < -0.009) deb.push({ id: id, v: -n[id] });
    });
    cred.sort(function (a, b) { return b.v - a.v; });
    deb.sort(function (a, b) { return b.v - a.v; });
    var out = [], i = 0, j = 0, guard = 0;
    while (i < cred.length && j < deb.length && guard++ < 50) {
      var amt = Math.min(cred[i].v, deb[j].v);
      out.push({ from: deb[j].id, to: cred[i].id, amount: Math.round(amt * 100) / 100 });
      cred[i].v -= amt; deb[j].v -= amt;
      if (cred[i].v < 0.01) i++;
      if (deb[j].v < 0.01) j++;
    }
    return out;
  }
  // 执行转账：先记入待抵扣额度，再按「优先收款方」逐笔销账
  function doTransfer(from, to, amount) {
    S.credit[from] = (S.credit[from] || 0) + amount;
    var loop = 0;
    while (loop++ < 60) {
      var list = debts().filter(function (d) { return d.from === from && d.amount <= S.credit[from] + 0.009; });
      if (!list.length) break;
      list.sort(function (a, b) { return (b.to === to ? 1 : 0) - (a.to === to ? 1 : 0) || b.amount - a.amount; });
      var d = list[0];
      var b = S.bills.filter(function (x) { return x.id === d.bill; })[0];
      b.paid[from] = true;
      S.credit[from] -= d.amount;
    }
    if (Math.abs(S.credit[from]) < 0.02) S.credit[from] = 0;
  }

  function monthTotal() { var t = 0; S.bills.forEach(function (b) { t += b.amount; }); return t; }
  function settledRate() {
    var tot = 0, un = 0;
    S.bills.forEach(function (b) {
      var sp = splitOf(b);
      Object.keys(sp).forEach(function (u) { if (u === b.payer) return; tot += sp[u]; if (!b.paid[u]) un += sp[u]; });
    });
    return tot === 0 ? 1 : (tot - un) / tot;
  }
  function loadOf(uid) { var t = 0; S.shifts.forEach(function (s) { if (s.u === uid) t += task(s.t).min; }); return t; }
  function choreRate() {
    var due = S.shifts.filter(function (s) { return s.day <= todayNum; });
    if (!due.length) return 1;
    return due.filter(function (s) { return s.done; }).length / due.length;
  }
  function lowSupplies() { return S.supplies.filter(function (s) { return s.stock <= 25; }); }


  /* ---------- 新手引导 ---------- */
  var ONB = [
    { go: 'settle', e: '💸', b: '一键最优结清', s: '4 个人 10 笔交叉欠款，算成 3 笔转账' },
    { go: 'chores', e: '🧹', b: '按耗时排班，不按次数', s: '刷厕所 25 分钟、倒垃圾 5 分钟，不算一份工' },
    { go: 'supplies', e: '🧺', b: '买了就自动入账', s: '登记采购直接生成均摊账单，不用开口要钱' }
  ];
  function buildOnb() {
    var h = '<div class="onb-in">' +
      '<div class="onb-mark onb-anim">屋</div>' +
      '<h2 class="onb-anim" style="animation-delay:.04s">同屋 ROOMLY</h2>' +
      '<h1 class="onb-anim" style="animation-delay:.08s">合租生活管家</h1>' +
      '<p class="onb-sub onb-anim" style="animation-delay:.12s">房租水电怎么摊、这周该谁拖地、<br>纸巾还剩多少、公约谁说了算——<br>合租最容易吵架的四件事，一个地方讲清楚。</p>' +
      '<div class="onb-t onb-anim" style="animation-delay:.16s">这三处最值得点开看</div><div class="onb-list">';
    ONB.forEach(function (o, i) {
      h += '<button class="onb-i onb-anim" data-go="' + o.go + '" style="animation-delay:' + (.2 + i * .05) + 's">' +
        '<span class="e">' + o.e + '</span><span class="tx"><b>' + o.b + '</b><span>' + o.s + '</span></span>' +
        '<span class="ar">›</span></button>';
    });
    h += '</div><div class="onb-foot onb-anim" style="animation-delay:.36s">' +
      '<button class="btn" data-onb="tour">开始体验 · 带我看一遍</button>' +
      '<button class="btn line" data-onb="skip" style="margin-top:9px">跳过讲解，直接用</button>' +
      '<p>可交互原型 · 记一笔账、打个卡、投一票都会真实生效<br>数据只存在你本机浏览器，可随时在「⋯ 房间」里重置</p>' +
      '</div></div>';
    $('onb').innerHTML = h;
  }
  function showOnb() { buildOnb(); $('onb').classList.add('on'); }


  /* ---------- 功能讲解 ---------- */
  var TOUR = [
    {
      tab: 'home', sel: '.js-todos', title: '首页 · 今天该做什么',
      why: '合租的事散在微信群里，说完就沉底。首页把「今天轮到你的」「快用完的」「还没结的账」聚合成一屏。',
      how: '每条右边的按钮可以直接打卡、去登记、去结清，不用自己翻。'
    },
    {
      tab: 'bills', sel: '.fab', title: '账本 · 记一笔',
      why: '真实的合租账从来不是简单均摊：房租按房间大小、水电按谁在住、聚餐只算吃了的人。',
      how: '点右下角 ＋ 记一笔。选分类会自动推荐分摊方式，切换方式时下面会实时显示每人该分多少。'
    },
    {
      tab: 'bills', sel: '.js-settle', title: '账本 · 一键最优结清',
      why: '四个人互相垫付，很快就变成十来笔交叉欠款。谁该转给谁、转多少最省事，得算。',
      how: '点「一键结清」，系统用债务图简化算出最少转账笔数，转完自动把相关账单销账。钱还是走微信转账。'
    },
    {
      tab: 'chores', sel: '.js-load', title: '值日 · 按耗时排班',
      why: '刷厕所 25 分钟、倒垃圾 5 分钟，简单轮流看着公平其实不公平。这里按耗时分配，让每人每周的总分钟数接近。',
      how: '排班表里点「打卡」完成；出差那周点「换班」转给室友。完成自动累积家务币，让付出被看见。'
    },
    {
      tab: 'supplies', sel: '.sup.low', title: '物资 · 买了自动入账',
      why: '纸巾用完才发现就晚了；自己垫钱买了没人记得，更伤感情。',
      how: '余量条按消耗速度预测还能用几天，低了自动告急。点「我买了」填个金额，系统自动生成一笔均摊账单进账本。'
    },
    {
      tab: 'pact', sel: '.vote', title: '公约 · 提案投票生效',
      why: '规矩要在吵架之前定好，而且得有生效流程——不能谁先住进来谁说了算。',
      how: '任何人都能发起提案，全员投票，3/4 同意立刻生效并写进条款；新室友入住自动适用。'
    }
  ];
  var tourI = -1;
  function tourClear() {
    [].forEach.call(document.querySelectorAll('.tour-hi,.tour-hi-rel'), function (e) {
      e.classList.remove('tour-hi'); e.classList.remove('tour-hi-rel');
    });
  }
  function tourEnd() {
    tourClear(); tourI = -1;
    document.body.classList.remove('tour-on');
    $('tour').classList.remove('on'); $('tour').innerHTML = '';
    try { localStorage.setItem(SEEN, '1'); } catch (e) { }
  }
  function tourShow(i) {
    if (i < 0) i = 0;
    if (i >= TOUR.length) {
      tourEnd(); render();
      toast('讲解结束 · 现在随便点<br><span style="font-size:11.5px;opacity:.7">记一笔账、打个卡、投一票都会真实生效</span>');
      return;
    }
    tourI = i;
    var s = TOUR[i];
    $('onb').classList.remove('on');
    document.body.classList.add('tour-on');
    S.tab = s.tab; render();
    tourClear();
    setTimeout(function () {
      var el = s.sel ? document.querySelector(s.sel) : null;
      var t = $('tour');
      t.classList.remove('top');
      if (!el) return;
      el.classList.add('tour-hi');
      if (getComputedStyle(el).position === 'static') el.classList.add('tour-hi-rel');
      // 只滚动内容区；scrollIntoView 会连 overflow:hidden 的外壳一起滚，必须复位
      var box0 = document.querySelector('.device-screen');
      if (el.closest('.screen')) { try { el.scrollIntoView({ block: 'center' }); } catch (e) { } }
      box0.scrollTop = 0; box0.scrollLeft = 0;
      // 卡片避让：目标落在下半屏时，把讲解卡移到顶部，别挡住要点的按钮
      var r = el.getBoundingClientRect();
      var box = document.querySelector('.device-screen').getBoundingClientRect();
      if (r.bottom > box.bottom - t.offsetHeight - 18) t.classList.add('top');
    }, 40);
    var dots = '';
    TOUR.forEach(function (x, k) { dots += '<i class="' + (k === i ? 'on' : '') + '"></i>'; });
    $('tour').innerHTML =
      '<div class="tour-c">' +
      '<div class="tour-step">第 ' + (i + 1) + ' / ' + TOUR.length + ' 步</div>' +
      '<h4>' + s.title + '</h4>' +
      '<div class="tour-l"><b>做什么用</b><span>' + s.why + '</span></div>' +
      '<div class="tour-l"><b>怎么操作</b><span>' + s.how + '</span></div>' +
      '<div class="tour-b"><span class="tour-dots">' + dots + '</span>' +
      '<button class="tour-skip" data-t="skip">跳过</button>' +
      (i > 0 ? '<button class="tour-prev" data-t="prev">上一步</button>' : '') +
      '<button class="tour-next" data-t="next">' + (i === TOUR.length - 1 ? '开始使用' : '下一步') + '</button>' +
      '</div></div>';
    $('tour').classList.add('on');
  }

  /* ---------- 渲染：顶栏 ---------- */
  function renderTop() {
    var avs = S.members.map(function (m) { return avatar(m.id); }).join('');
    $('topbar').innerHTML =
      '<div class="tb-row">' +
      '<div class="tb-emoji">🏠</div>' +
      '<div><div class="tb-name">' + esc(S.room.name) + '</div>' +
      '<div class="tb-sub">' + S.members.length + ' 位室友 · 已同住 ' + S.room.since + ' 天</div></div>' +
      '<button class="tb-btn" onclick="A.settings()">⋯ 房间</button></div>' +
      '<div class="tb-avs">' + avs + '</div>';
  }

  /* ---------- 页面：首页 ---------- */
  function viewHome() {
    var h = '', me = S.me;
    var hour = now.getHours();
    var greet = hour < 6 ? '还没睡呀' : hour < 11 ? '早上好' : hour < 14 ? '中午好' : hour < 18 ? '下午好' : '晚上好';

    h += '<div class="hello"><h2>' + greet + '，' + esc(mem(me).real || '我') + '</h2>' +
      '<p>' + M + ' 月 ' + now.getDate() + ' 日 ' + WD[now.getDay()] + ' · 房间一切都在记账中</p></div>';

    /* 今日待办 */
    var todos = [];
    S.shifts.filter(function (s) { return s.u === me && s.day === todayNum && !s.done; }).forEach(function (s) {
      var t = task(s.t);
      todos.push({ e: t.emoji, bg: 'var(--brand-soft)', b: '今天轮到你：' + t.name, s: '预计 ' + t.min + ' 分钟 · 完成 +' + Math.round(t.min / 5) + ' 家务币',
        btn: '打卡', act: "A.checkIn('" + s.id + "')" });
    });
    lowSupplies().forEach(function (s) {
      todos.push({ e: s.emoji, bg: 'var(--brand-soft)', b: s.name + ' 快用完了', s: '余量 ' + s.stock + '%，预计还能用 ' + Math.max(1, Math.round(s.stock / 100 * s.cycle)) + ' 天',
        btn: '去登记', act: "A.go('supplies')" });
    });
    var myDebt = 0;
    debts().forEach(function (d) { if (d.from === me) myDebt += d.amount; });
    if (myDebt > 0.01) {
      todos.push({ e: '💸', bg: 'var(--amber-soft)', b: '你有 ' + yuan(myDebt) + ' 待结清', s: '管家提醒：本月 10 日前结清', btn: '去结清', act: "A.go('bills')" });
    }
    var needVote = S.votes.filter(function (v) { return v.yes.indexOf(me) < 0 && v.no.indexOf(me) < 0; });
    if (needVote.length) {
      todos.push({ e: '🗳️', bg: 'var(--teal-soft)', b: needVote.length + ' 条公约提案等你投票', s: '「' + needVote[0].title + '」等 ' + needVote.length + ' 条', btn: '去投票', act: "A.go('pact')", gh: 1 });
    }

    h += '<div class="sec-t">今日待办 · ' + todos.length + '</div>';
    if (!todos.length) h += '<div class="card"><div class="empty"><span>🌿</span>今天没有待办，房间状态良好</div></div>';
    else {
      h += '<div class="card tight js-todos">';
      todos.slice(0, 5).forEach(function (t) {
        h += '<div class="todo"><div class="e" style="background:' + t.bg + '">' + t.e + '</div>' +
          '<div class="tx"><b>' + esc(t.b) + '</b><span>' + esc(t.s) + '</span></div>' +
          '<button class="go ' + (t.gh ? 'gh' : '') + '" onclick="' + t.act + '">' + t.btn + '</button></div>';
      });
      h += '</div>';
    }

    /* 我的净额 */
    var n = nets()[me], rate = settledRate();
    h += '<div class="sec-t">我的本月</div>' +
      '<div class="net-card">' +
      '<div class="k">' + (n >= 0 ? '室友合计应还给我' : '我合计应付给室友') + '</div>' +
      '<div class="v">' + (n >= 0 ? '+' : '−') + yuan(Math.abs(n)).slice(1) + '</div>' +
      '<div class="d">本月公共支出 ' + y0(monthTotal()) + ' · 已结清 ' + Math.round(rate * 100) + '%</div>' +
      '<div class="bar"><i style="width:' + Math.round(rate * 100) + '%"></i></div>' +
      '<button class="btn" onclick="A.settle()">一键最优结清</button></div>';

    /* 贡献榜 */
    var ms = S.members.slice().sort(function (a, b) { return b.coins - a.coins; });
    var max = ms[0].coins || 1;
    h += '<div class="sec-t">家务贡献榜 · ' + M + ' 月<span class="more" onclick="A.coinsInfo()">怎么算的?</span></div><div class="card tight" style="padding:6px 0">';
    ms.forEach(function (m) {
      h += '<div class="rank">' + avatar(m.id) +
        '<span class="n">' + esc(m.name) + '</span>' +
        '<span class="bar"><i style="width:' + Math.round(m.coins / max * 100) + '%;background:' + m.color + '"></i></span>' +
        '<span class="v">' + m.coins + ' 币</span></div>';
    });
    h += '</div>';

    /* 健康度 */
    var sup = Math.round((S.supplies.length - lowSupplies().length) / S.supplies.length * 100);
    h += '<div class="sec-t">房间健康度</div><div class="health">' +
      '<div class="h"><b style="color:' + (rate > .7 ? 'var(--teal)' : 'var(--alert)') + '">' + Math.round(rate * 100) + '%</b><span>账单结清率</span></div>' +
      '<div class="h"><b style="color:' + (choreRate() > .7 ? 'var(--teal)' : 'var(--alert)') + '">' + Math.round(choreRate() * 100) + '%</b><span>值日完成率</span></div>' +
      '<div class="h"><b style="color:' + (sup > 70 ? 'var(--teal)' : 'var(--alert)') + '">' + sup + '%</b><span>物资充足度</span></div></div>';

    return h;
  }

  /* ---------- 页面：账本 ---------- */
  function viewBills() {
    var h = '', me = S.me, n = nets()[me];
    var owe = 0, get = 0;
    debts().forEach(function (d) { if (d.from === me) owe += d.amount; if (d.to === me) get += d.amount; });

    h += '<div class="sum">' +
      '<div><div class="k">本月公共支出</div><div class="v">' + y0(monthTotal()) + '</div></div>' +
      '<div><div class="k">我的净额</div><div class="v" style="color:' + (n >= 0 ? 'var(--teal)' : 'var(--alert)') + '">' + (n >= 0 ? '+' : '−') + yuan(Math.abs(n)).slice(1) + '</div></div></div>';

    h += '<div class="card" style="padding:13px 14px">' +
      '<div style="display:flex;gap:10px;align-items:center">' +
      '<div style="flex:1;font-size:12.5px;color:var(--ink3);line-height:1.6">待收 <b style="color:var(--teal)">' + yuan(get) + '</b> · 待付 <b style="color:var(--brand)">' + yuan(owe) + '</b></div>' +
      '<button class="btn sm js-settle" onclick="A.settle()">一键结清</button></div></div>';

    h += '<div class="sec-t">' + M + ' 月账单 · ' + S.bills.length + ' 笔<span class="more" onclick="A.moveOut()">退租结算单</span></div><div class="card tight">';
    S.bills.slice().reverse().forEach(function (b) {
      var sp = splitOf(b), ids = Object.keys(sp);
      var okCnt = ids.filter(function (u) { return u === b.payer || b.paid[u]; }).length;
      var all = okCnt === ids.length;
      h += '<div class="row" onclick="A.bill(\'' + b.id + '\')">' +
        '<div class="ic">' + b.emoji + '</div><div class="mid">' +
        '<div class="t1">' + esc(b.title) + '</div>' +
        '<div class="t2">' + esc(nm(b.payer)) + '垫付 · ' + b.date +
        ' <span class="chip">' + METHODS[b.method].name + '</span>' +
        ' <span class="chip ' + (all ? 'g' : 'b') + '">' + (all ? '已结清' : okCnt + '/' + ids.length + ' 已结') + '</span></div></div>' +
        '<div class="right"><div class="amt">' + yuan(b.amount) + '</div>' +
        '<div style="font-size:11px;color:var(--ink3);margin-top:2px">我 ' + (sp[me] ? yuan(sp[me]) : '不参与') + '</div></div></div>';
    });
    h += '</div>';
    h += '<div class="note-box" style="background:var(--paper);color:var(--ink3)">💡 催款一律由「管家」名义发出，室友看不到是谁点的提醒。</div>';
    return h;
  }

  /* ---------- 页面：值日 ---------- */
  function viewChores() {
    var h = '', me = S.me;
    var loads = S.members.map(function (m) { return { id: m.id, v: loadOf(m.id), c: m.color, n: m.name }; });
    var maxL = Math.max.apply(null, loads.map(function (l) { return l.v; })) || 1;
    var minL = Math.min.apply(null, loads.map(function (l) { return l.v; }));
    var totalMin = loads.reduce(function (a, b) { return a + b.v; }, 0);

    var mine = S.shifts.filter(function (s) { return s.u === me; });
    var mineLeft = mine.filter(function (s) { return !s.done; });

    h += '<div class="card" style="background:var(--night);color:#fff;border-radius:18px">' +
      '<div style="font-size:11.5px;color:#9C938D">本周我的家务</div>' +
      '<div style="font-size:26px;font-weight:800;letter-spacing:-.8px;margin:5px 0 3px">' +
      (mine.length - mineLeft.length) + ' / ' + mine.length + ' 已完成</div>' +
      '<div style="font-size:11.5px;color:#9C938D">合计 ' + loadOf(me) + ' 分钟 · 全屋本周共 ' + totalMin + ' 分钟</div></div>';

    h += '<div class="sec-t">本周工作量是否均衡<span class="more" onclick="A.fairInfo()">排班规则</span></div><div class="card tight js-load" style="padding:8px 0">';
    loads.forEach(function (l) {
      h += '<div class="load-bar"><span class="n">' + esc(l.n) + '</span>' +
        '<span class="b"><i style="width:' + Math.round(l.v / maxL * 100) + '%;background:' + l.c + '"></i><em>' + l.v + ' 分钟</em></span>' +
        '<span class="v">' + Math.round(l.v / totalMin * 100) + '%</span></div>';
    });
    h += '</div>';
    h += '<div class="note-box">⚖️ 最重与最轻相差 ' + (maxL - minL) + ' 分钟。排班按「家务耗时」而不是「任务条数」分配——刷厕所 25 分钟，倒一次垃圾 5 分钟，不能算一份工。</div>';

    h += '<div class="sec-t">本周排班表</div><div class="card tight">';
    for (var d = 1; d <= 7; d++) {
      var list = S.shifts.filter(function (s) { return s.day === d; });
      if (!list.length) continue;
      h += '<div class="day' + (d === todayNum ? ' today' : '') + '">' +
        '<div class="d"><b>' + WD[d === 7 ? 0 : d] + '</b><span>' + (d === todayNum ? '今天' : '') + '</span></div><div class="tasks">';
      list.forEach(function (s) {
        var t = task(s.t), my = s.u === me;
        h += '<div class="ttask' + (s.done ? ' done' : '') + '">' + avatar(s.u) +
          '<span class="nm">' + t.emoji + ' ' + esc(t.name) + '</span>' +
          '<span class="mn">' + t.min + '′</span>' +
          (s.done ? '<span class="ck ok">✓ 已完成</span>'
            : my ? '<span class="ck" onclick="A.checkIn(\'' + s.id + '\')">打卡</span><span class="sw" onclick="A.swap(\'' + s.id + '\')">换班</span>'
              : '<span class="sw">待完成</span>') +
          '</div>';
      });
      h += '</div></div>';
    }
    h += '</div>';

    h += '<div class="sec-t">下周预览 · 自动轮转</div><div class="card"><div style="font-size:13px;color:var(--ink2);line-height:1.9">';
    var rot = ['t4', 't3', 't2'];
    rot.forEach(function (tid) {
      var cur = S.shifts.filter(function (s) { return s.t === tid; })[0];
      if (!cur) return;
      var idx = S.members.map(function (m) { return m.id; }).indexOf(cur.u);
      var nxt = S.members[(idx + 1) % S.members.length];
      h += '<div style="display:flex;align-items:center;gap:8px;padding:3px 0">' + task(tid).emoji + ' ' + esc(task(tid).name) +
        ' <span style="margin-left:auto;color:var(--ink3);font-size:12px">' + esc(nm(cur.u)) + ' → </span>' + avatar(nxt.id) + '</div>';
    });
    h += '</div></div>';
    return h;
  }

  /* ---------- 页面：物资 ---------- */
  function viewSupplies() {
    var h = '', low = lowSupplies();
    if (low.length) {
      h += '<div class="card" style="background:var(--ink);color:#fff;border-radius:16px">' +
        '<div style="font-size:13.5px;font-weight:700">⚠️ ' + low.length + ' 样公共物资即将用完</div>' +
        '<div style="font-size:12px;opacity:.85;margin-top:4px;line-height:1.6">' +
        low.map(function (s) { return s.name + '（约 ' + Math.max(1, Math.round(s.stock / 100 * s.cycle)) + ' 天）'; }).join('、') +
        '</div></div>';
    }
    h += '<div class="card" style="display:flex;align-items:center;gap:10px;padding:13px 14px">' +
      '<div style="font-size:12.5px;color:var(--ink3);flex:1;line-height:1.6">🛒 本轮采购轮到 <b style="color:var(--ink)">' + esc(nm(S.buyTurn)) + '</b><br>跑腿本身也算贡献，登记后 +5 家务币</div>' +
      avatar(S.buyTurn) + '</div>';

    h += '<div class="sec-t">公共物资 · ' + S.supplies.length + ' 项<span class="more" onclick="A.addSupply()">+ 添加</span></div><div class="sup-grid">';
    S.supplies.forEach(function (s) {
      var days = Math.max(0, Math.round(s.stock / 100 * s.cycle));
      var col = s.stock <= 25 ? 'var(--alert)' : s.stock <= 55 ? 'var(--amber)' : 'var(--teal)';
      h += '<div class="sup' + (s.stock <= 25 ? ' low' : '') + '">' +
        (s.stock <= 25 ? '<span class="tagl">告急</span>' : '') +
        '<div class="e">' + s.emoji + '</div><div class="n">' + esc(s.name) + '</div>' +
        '<div class="bar"><i style="width:' + s.stock + '%;background:' + col + '"></i></div>' +
        '<div class="d">余量 ' + s.stock + '% · 约 ' + days + ' 天<br>上次 ' + esc(nm(s.by)) + ' 买于 ' + s.on + '</div>' +
        '<button class="buy" onclick="A.buy(\'' + s.id + '\')">我买了，登记一下</button></div>';
    });
    h += '</div>';
    h += '<div class="note-box">💡 登记采购会<b>自动生成一笔均摊账单</b>进账本，垫钱的人不用再开口要钱。</div>';
    return h;
  }

  /* ---------- 页面：公约 ---------- */
  function viewPact() {
    var h = '', me = S.me, need = Math.ceil(S.members.length * S.room.rule);

    h += '<div class="card" style="background:var(--night);color:#fff;border-radius:18px">' +
      '<div style="font-size:11.5px;color:#9C938D">已生效条款</div>' +
      '<div style="font-size:26px;font-weight:800;margin:5px 0 3px;letter-spacing:-.8px">' + S.pacts.length + ' 条</div>' +
      '<div style="font-size:11.5px;color:#9C938D">全员签署 · 新室友入住即自动生效 · ' + need + '/' + S.members.length + ' 同意即可通过</div></div>';

    if (S.votes.length) {
      h += '<div class="sec-t">投票中 · ' + S.votes.length + '</div>';
      S.votes.forEach(function (v) {
        var voted = v.yes.indexOf(me) >= 0 ? 'yes' : v.no.indexOf(me) >= 0 ? 'no' : '';
        h += '<div class="vote"><div class="pact-h" style="display:flex;align-items:center;gap:8px;margin-bottom:7px">' +
          '<span class="chip a">' + v.cat + '</span><b style="font-size:14.5px">' + esc(v.title) + '</b></div>' +
          '<div class="pact" style="box-shadow:none;padding:0;margin:0"><div class="tx">' + esc(v.text) + '</div></div>' +
          '<div class="prog"><i style="width:' + (v.yes.length / S.members.length * 100) + '%"></i><u style="width:' + (v.no.length / S.members.length * 100) + '%"></u></div>' +
          '<div style="font-size:11.5px;color:var(--ink3)">' + esc(nm(v.by)) + ' 发起 · 同意 ' + v.yes.length + ' / 反对 ' + v.no.length + ' · 还差 ' + Math.max(0, need - v.yes.length) + ' 票生效</div>' +
          '<div class="acts">' + (voted
            ? '<div class="voted">你已投「' + (voted === 'yes' ? '同意' : '反对') + '」，等待其他室友</div>'
            : '<button class="yes" onclick="A.vote(\'' + v.id + '\',1)">同意</button><button class="no" onclick="A.vote(\'' + v.id + '\',0)">反对</button>') +
          '</div></div>';
      });
    }

    h += '<div class="sec-t">已生效条款<span class="more" onclick="A.propose()">+ 发起提案</span></div>';
    S.pacts.forEach(function (p) {
      h += '<div class="pact"><div class="h"><span class="chip b">' + p.cat + '</span><b>' + esc(p.title) + '</b></div>' +
        '<div class="tx">' + esc(p.text) + '</div>' +
        '<div class="f">✅ ' + p.vote + ' 通过 · ' + p.on + ' 生效</div></div>';
    });

    h += '<div class="sec-t">违约记录 · ' + M + ' 月</div><div class="card tight">';
    if (!S.records.length) h += '<div class="empty"><span>🎉</span>本月没有任何记录</div>';
    S.records.forEach(function (r) {
      h += '<div class="row">' + avatar(r.u) +
        '<div class="mid"><div class="t1" style="font-size:13.5px">' + esc(r.p) + '</div>' +
        '<div class="t2">' + esc(nm(r.u)) + ' · ' + r.on + ' · 管家已统一提醒，未点名</div></div></div>';
    });
    h += '</div>';
    h += '<div class="note-box">📜 条款可绑定后果：如「访客留宿超 3 晚」会直接影响水电按在住天数的分摊结果，规则不只停留在纸面。</div>';
    return h;
  }

  /* ---------- 渲染 ---------- */
  var VIEWS = { home: viewHome, bills: viewBills, chores: viewChores, supplies: viewSupplies, pact: viewPact };
  function render() {
    renderTop();
    var sc = $('screen');
    sc.innerHTML = VIEWS[S.tab]();
    sc.scrollTop = 0;
    var old = document.querySelector('.fab'); if (old) old.remove();
    if (S.tab === 'bills') {
      var f = document.createElement('button');
      f.className = 'fab'; f.innerHTML = '+'; f.onclick = function () { A.addBill(); };
      document.querySelector('.device-screen').appendChild(f);
    }
    [].forEach.call(document.querySelectorAll('.tab'), function (t) {
      t.classList.toggle('is-on', t.dataset.tab === S.tab);
    });
    save();
  }

  /* ---------- 弹层 / Toast ---------- */
  function sheet(title, html) {
    $('sheetTitle').textContent = title;
    $('sheetBody').innerHTML = html;
    $('sheet').classList.add('on'); $('mask').classList.add('on');
  }
  function closeSheet() { $('sheet').classList.remove('on'); $('mask').classList.remove('on'); }
  var tT;
  function toast(msg) {
    var t = $('toast'); t.innerHTML = msg; t.classList.add('on');
    clearTimeout(tT); tT = setTimeout(function () { t.classList.remove('on'); }, 2600);
  }
  function coin(uid, n) { mem(uid).coins += n; }

  /* ---------- 交互 ---------- */
  var A = {
    go: function (tab) { S.tab = tab; render(); },

    onbGo: function (go) {
      $('onb').classList.remove('on');
      try { localStorage.setItem(SEEN, '1'); } catch (e) { }
      if (go === 'tour') { tourShow(0); return; }
      if (go === 'settle') { S.tab = 'bills'; render(); setTimeout(function () { A.settle(); }, 280); }
      else if (go && go !== 'skip') { S.tab = go; render(); }
    },
    onbShow: function () { closeSheet(); showOnb(); },
    tourStart: function () { closeSheet(); $('onb').classList.remove('on'); tourShow(0); },

    /* 值日 */
    checkIn: function (id) {
      var s = S.shifts.filter(function (x) { return x.id === id; })[0];
      if (!s || s.done) return;
      s.done = true;
      var t = task(s.t), c = Math.round(t.min / 5);
      coin(s.u, c);
      render();
      toast('✅ ' + t.name + ' 已打卡，+' + c + ' 家务币');
    },
    swap: function (id) {
      var s = S.shifts.filter(function (x) { return x.id === id; })[0];
      var h = '<div class="fl">把这次「' + esc(task(s.t).name) + '」转给谁</div><div class="picker">';
      S.members.forEach(function (m) {
        if (m.id === S.me) return;
        h += '<div class="pick" onclick="A.doSwap(\'' + id + '\',\'' + m.id + '\')">' + avatar(m.id) +
          '<span class="nm">' + esc(m.name) + '</span>' +
          '<span style="font-size:11.5px;color:var(--ink3)">本周 ' + loadOf(m.id) + ' 分钟</span></div>';
      });
      h += '</div><div class="note-box">接班的人会获得这次家务的全部家务币，下周排班会自动把工作量补回来——不用在群里求人。</div>';
      sheet('请人替班', h);
    },
    doSwap: function (id, uid) {
      var s = S.shifts.filter(function (x) { return x.id === id; })[0];
      s.u = uid; closeSheet(); render();
      toast('🤝 已转给' + esc(mem(uid).name) + '，管家会代为通知');
    },
    fairInfo: function () {
      sheet('排班规则', '<div class="pact" style="box-shadow:none;background:transparent;padding:0"><div class="tx">' +
        '<b>1. 按耗时排班，不按次数。</b>每项家务带一个「耗时权重」：倒垃圾 5 分钟、厨房台面 15 分钟、扫地拖地 20 分钟、卫生间深度清洁 25 分钟。<br><br>' +
        '<b>2. 目标是每人每周总分钟数接近。</b>简单轮转会让「这周刷厕所」和「这周倒垃圾」算成一样的一份工，这正是值日表最容易吵架的地方。<br><br>' +
        '<b>3. 重活自动轮转。</b>卫生间、厨房这类高耗时任务每周换人，谁也不会连续背两周。<br><br>' +
        '<b>4. 未完成不吵架。</b>连续未完成触发的是公约里预先约定好的后果，而不是一次争吵。' +
        '</div></div>');
    },

    /* 账本 */
    bill: function (id) {
      var b = S.bills.filter(function (x) { return x.id === id; })[0];
      var sp = splitOf(b);
      var h = '<div class="card" style="text-align:center;padding:18px">' +
        '<div style="font-size:30px">' + b.emoji + '</div>' +
        '<div style="font-size:26px;font-weight:800;letter-spacing:-1px;margin:6px 0 3px">' + yuan(b.amount) + '</div>' +
        '<div style="font-size:12.5px;color:var(--ink3)">' + esc(nm(b.payer)) + ' 垫付 · ' + b.date + ' · ' + METHODS[b.method].name + '</div></div>';
      h += '<div class="fl">分摊明细</div><div class="card">';
      S.members.forEach(function (m) {
        if (sp[m.id] === undefined) return;
        var ok = m.id === b.payer || b.paid[m.id];
        h += '<div class="split-line">' + avatar(m.id) + '<span>' + esc(m.name) + '</span>' +
          (b.method === 'days' ? '<span class="chip">在住 ' + m.days + ' 天</span>' : '') +
          (b.method === 'room' ? '<span class="chip">' + m.room + ' ×' + m.factor + '</span>' : '') +
          '<span class="m">' + yuan(sp[m.id]) + '</span>' +
          '<span class="st" style="color:' + (ok ? 'var(--teal)' : 'var(--alert)') + '">' +
          (m.id === b.payer ? '垫付方' : ok ? '✓ 已结' : '未结') + '</span></div>';
      });
      h += '</div>';
      var un = S.members.filter(function (m) { return sp[m.id] !== undefined && m.id !== b.payer && !b.paid[m.id]; });
      if (un.length && b.payer === S.me) {
        h += '<button class="btn ghost" onclick="A.nudge()">提醒未结清的 ' + un.length + ' 位室友</button>';
      }
      if (sp[S.me] !== undefined && S.me !== b.payer && !b.paid[S.me]) {
        h += '<button class="btn" onclick="A.payOne(\'' + b.id + '\')">我已转账 ' + yuan(sp[S.me]) + '</button>';
      }
      sheet(b.title, h);
    },
    payOne: function (id) {
      var b = S.bills.filter(function (x) { return x.id === id; })[0];
      b.paid[S.me] = true; closeSheet(); render();
      toast('✅ 已标记结清，' + esc(nm(b.payer)) + ' 会收到到账通知');
    },
    nudge: function () {
      closeSheet();
      toast('🔔 已由「管家」统一提醒<br><span style="font-size:11.5px;opacity:.7">室友看不到是谁点的，不用你开口</span>');
    },
    settle: function () {
      var p = plan();
      if (!p.length) {
        sheet('一键最优结清', '<div class="empty"><span>🎉</span>所有账目都已结清<br>本月房间零欠款</div>');
        return;
      }
      var raw = debts().length;
      var h = '<div class="card" style="background:var(--brand-soft);padding:15px">' +
        '<div style="font-size:13px;color:var(--ink2);line-height:1.8">房间里现在有 <b style="color:var(--brand)">' + raw + ' 笔</b>交叉欠款。<br>' +
        '按债务图简化后，只需要 <b style="color:var(--brand)">' + p.length + ' 笔</b>转账就能全部结清。</div></div>';
      h += '<div class="fl">最优转账方案</div><div class="pay-list">';
      p.forEach(function (t, i) {
        h += '<div class="pay">' + avatar(t.from) + '<span class="who">' + esc(nm(t.from)) + '</span>' +
          '<span class="arrow">→</span>' + avatar(t.to) + '<span class="who">' + esc(nm(t.to)) + '</span>' +
          '<span class="m">' + yuan(t.amount) + '</span></div>';
      });
      h += '</div>';
      var myT = p.filter(function (t) { return t.from === S.me; })[0];
      if (myT) {
        h += '<button class="btn" onclick="A.doPay(\'' + myT.from + '\',\'' + myT.to + '\',' + myT.amount + ')">' +
          '微信转 ' + yuan(myT.amount) + ' 给' + esc(nm(myT.to)) + '，并销账</button>';
      }
      h += '<button class="btn ' + (myT ? 'line' : '') + '" onclick="A.doAll()">' + (myT ? '标记全部转账已完成（演示）' : '标记全部转账已完成') + '</button>';
      h += '<div class="note-box">我们不做自建支付。钱仍然走你熟悉的微信转账，Roomly 只负责算清楚、并在转账后自动销账。</div>';
      sheet('一键最优结清', h);
    },
    doPay: function (f, t, a) {
      doTransfer(f, t, a); closeSheet(); render();
      toast('✅ 已结清 ' + yuan(a) + '<br><span style="font-size:11.5px;opacity:.7">相关账单已自动标记</span>');
    },
    doAll: function () {
      plan().forEach(function (t) { doTransfer(t.from, t.to, t.amount); });
      closeSheet(); render();
      toast('🎉 全部结清，本月房间零欠款');
    },
    addBill: function () {
      var cats = [
        { e: '🏠', n: '房租', m: 'room' }, { e: '💡', n: '水电燃气', m: 'days' },
        { e: '📶', n: '宽带', m: 'even' }, { e: '🧺', n: '日用品', m: 'even' },
        { e: '🍲', n: '餐饮', m: 'picked' }, { e: '🔧', n: '维修', m: 'even' }, { e: '📦', n: '其他', m: 'even' }
      ];
      var h = '<div class="fl">金额</div>' +
        '<input class="inp" id="fAmt" type="number" inputmode="decimal" placeholder="0.00" oninput="A.prev()">' +
        '<div class="fl">说明</div><input class="inp" id="fTitle" placeholder="例如：9 月水电燃气">' +
        '<div class="fl">分类（会自动推荐分摊方式）</div><div class="chips" id="fCats">';
      cats.forEach(function (c, i) {
        h += '<button class="ch' + (i === 1 ? ' on' : '') + '" data-c="' + c.n + '" data-e="' + c.e + '" data-m="' + c.m + '" onclick="A.pickCat(this)">' + c.e + ' ' + c.n + '</button>';
      });
      h += '</div><div class="fl">谁垫付的</div><div class="chips" id="fPayer">';
      S.members.forEach(function (m, i) {
        h += '<button class="ch' + (m.id === S.me ? ' on' : '') + '" data-u="' + m.id + '" onclick="A.pickOne(this,\'fPayer\')">' + esc(m.name) + '</button>';
      });
      h += '</div><div class="fl">分摊方式</div><div class="chips" id="fMethod">';
      Object.keys(METHODS).forEach(function (k) {
        h += '<button class="ch' + (k === 'days' ? ' on' : '') + '" data-m="' + k + '" onclick="A.pickMethod(this)">' + METHODS[k].name + '<span class="sub">' + METHODS[k].sub + '</span></button>';
      });
      h += '</div><div id="fExtra"></div><div class="prev" id="fPrev">填写金额后显示分摊预览</div>' +
        '<button class="btn" onclick="A.saveBill()">记一笔</button>';
      sheet('记一笔公共开销', h);
      A.prev();
    },
    pickCat: function (el) {
      [].forEach.call(el.parentNode.children, function (c) { c.classList.remove('on'); });
      el.classList.add('on');
      var m = el.dataset.m;
      [].forEach.call($('fMethod').children, function (c) { c.classList.toggle('on', c.dataset.m === m); });
      if (!$('fTitle').value) $('fTitle').placeholder = '例如：' + M + ' 月' + el.dataset.c;
      A.pickMethod($('fMethod').querySelector('.on'));
    },
    pickOne: function (el, box) {
      [].forEach.call($(box).children, function (c) { c.classList.remove('on'); });
      el.classList.add('on'); A.prev();
    },
    pickMethod: function (el) {
      [].forEach.call($('fMethod').children, function (c) { c.classList.remove('on'); });
      el.classList.add('on');
      var m = el.dataset.m, h = '';
      if (m === 'picked') {
        h = '<div class="fl">这笔算谁的</div><div class="picker" id="fPick">';
        S.members.forEach(function (mm) {
          h += '<div class="pick on" data-u="' + mm.id + '" onclick="this.classList.toggle(\'on\');A.prev()">' + avatar(mm.id) +
            '<span class="nm">' + esc(mm.name) + '</span><span class="box">✓</span></div>';
        });
        h += '</div>';
      } else if (m === 'custom') {
        h = '<div class="fl">逐人填写金额</div><div class="picker" id="fCustom">';
        S.members.forEach(function (mm) {
          h += '<div class="pick">' + avatar(mm.id) + '<span class="nm">' + esc(mm.name) + '</span>' +
            '<input class="ipt" type="number" inputmode="decimal" data-u="' + mm.id + '" placeholder="0.00" oninput="A.prev()"></div>';
        });
        h += '</div>';
      } else if (m === 'days') {
        h = '<div class="fl">本月在住天数</div><div class="picker">';
        S.members.forEach(function (mm) {
          h += '<div class="pick">' + avatar(mm.id) + '<span class="nm">' + esc(mm.name) + '</span>' +
            '<span style="font-size:12.5px;color:var(--ink3)">' + mm.days + ' 天</span></div>';
        });
        h += '</div>';
      } else if (m === 'room') {
        h = '<div class="fl">房间系数</div><div class="picker">';
        S.members.forEach(function (mm) {
          h += '<div class="pick">' + avatar(mm.id) + '<span class="nm">' + esc(mm.name) + '</span>' +
            '<span style="font-size:12.5px;color:var(--ink3)">' + mm.room + ' × ' + mm.factor + '</span></div>';
        });
        h += '</div>';
      }
      $('fExtra').innerHTML = h;
      A.prev();
    },
    readForm: function () {
      var amt = parseFloat($('fAmt').value) || 0;
      var cat = $('fCats').querySelector('.on');
      var payer = $('fPayer').querySelector('.on').dataset.u;
      var method = $('fMethod').querySelector('.on').dataset.m;
      var picked = null, custom = null;
      if (method === 'picked') {
        picked = [].filter.call($('fPick').children, function (c) { return c.classList.contains('on'); })
          .map(function (c) { return c.dataset.u; });
      }
      if (method === 'custom') {
        custom = {};
        [].forEach.call($('fCustom').querySelectorAll('input'), function (i) {
          var v = parseFloat(i.value); if (v) custom[i.dataset.u] = v;
        });
      }
      return { amt: amt, cat: cat, payer: payer, method: method, picked: picked, custom: custom };
    },
    prev: function () {
      if (!$('fPrev')) return;
      var f = A.readForm();
      if (!f.amt) { $('fPrev').innerHTML = '填写金额后显示分摊预览'; return; }
      var fake = { amount: f.amt, method: f.method, picked: f.picked, custom: f.custom };
      var sp = splitOf(fake);
      var txt = S.members.filter(function (m) { return sp[m.id] !== undefined; })
        .map(function (m) { return esc(m.name) + ' <b>' + yuan(sp[m.id]) + '</b>'; }).join(' · ');
      var sum = 0; Object.keys(sp).forEach(function (k) { sum += sp[k]; });
      $('fPrev').innerHTML = (txt || '请至少选择一个人') +
        (f.method === 'custom' ? '<br><span style="font-size:11.5px">已填 ' + yuan(sum) + ' / 共 ' + yuan(f.amt) + '</span>' : '');
    },
    saveBill: function () {
      var f = A.readForm();
      if (!f.amt) { toast('请先填写金额'); return; }
      var title = $('fTitle').value.trim() || (M + ' 月' + f.cat.dataset.c);
      var b = mk('b' + Date.now(), f.cat.dataset.e, f.cat.dataset.c, title, f.amt, f.payer, f.method,
        M + '月' + now.getDate() + '日', {}, f.picked);
      if (f.custom) b.custom = f.custom;
      S.bills.push(b);
      closeSheet(); S.tab = 'bills'; render();
      toast('✅ 已记入账本，管家会通知室友确认');
    },
    moveOut: function () {
      var me = S.me, n = nets()[me];
      var supVal = 0;
      S.supplies.forEach(function (s) { if (s.by === me) supVal += s.price * s.stock / 100; });
      var deposit = 3000;
      var h = '<div class="card" style="padding:16px">' +
        '<div style="font-size:12.5px;color:var(--ink3);line-height:1.7">室友换人是合租矛盾最集中的时刻。一张单子讲清楚，不用吵到凌晨两点。</div></div>';
      h += '<div class="fl">退租对账单 · ' + esc(mem(me).real) + '</div><div class="card">' +
        line('押金退还', deposit) +
        line('未结清账单净额', n) +
        line('我垫付的公共物资余量折价', supVal) +
        line('公共区域损坏扣减', 0) +
        '<div class="split-line" style="border-top:1.5px solid var(--line);margin-top:4px;padding-top:12px">' +
        '<b style="font-size:15px">应退合计</b><span class="m" style="font-size:18px;color:var(--ink)">' + yuan(deposit + n + supVal) + '</span></div></div>';
      h += '<div class="note-box">所有明细来自这半年真实记录的账本与物资登记，不依赖任何人的记忆。</div>';
      sheet('退租一键结算', h);
      function line(k, v) {
        return '<div class="split-line"><span>' + k + '</span><span class="m" style="color:' + (v < 0 ? 'var(--alert)' : 'var(--ink)') + '">' +
          (v < 0 ? '−' : '+') + yuan(Math.abs(v)).slice(1) + '</span></div>';
      }
    },

    /* 物资 */
    buy: function (id) {
      var s = S.supplies.filter(function (x) { return x.id === id; })[0];
      var h = '<div class="card" style="text-align:center;padding:18px">' +
        '<div style="font-size:32px">' + s.emoji + '</div><div style="font-weight:700;margin-top:5px">' + esc(s.name) + '</div>' +
        '<div style="font-size:12px;color:var(--ink3);margin-top:3px">上次 ' + esc(nm(s.by)) + ' 买于 ' + s.on + ' · ' + yuan(s.price) + '</div></div>';
      h += '<div class="fl">这次花了多少</div><input class="inp" id="buyAmt" type="number" inputmode="decimal" value="' + s.price + '">' +
        '<div class="prev">登记后将<b>自动生成一笔均摊账单</b>进账本，每人约 ' +
        yuan(s.price / S.members.length) + '，并为你 +5 家务币。</div>' +
        '<button class="btn" onclick="A.doBuy(\'' + s.id + '\')">登记并自动入账</button>';
      sheet('登记采购', h);
    },
    doBuy: function (id) {
      var s = S.supplies.filter(function (x) { return x.id === id; })[0];
      var amt = parseFloat($('buyAmt').value) || s.price;
      s.stock = 100; s.by = S.me; s.on = M + '月' + now.getDate() + '日'; s.price = amt;
      S.bills.push(mk('b' + Date.now(), s.emoji, '日用品', '公共物资：' + s.name, amt, S.me, 'even', M + '月' + now.getDate() + '日', {}));
      coin(S.me, 5);
      var idx = S.members.map(function (m) { return m.id; }).indexOf(S.buyTurn);
      S.buyTurn = S.members[(idx + 1) % S.members.length].id;
      closeSheet(); render();
      toast('✅ 已登记，' + yuan(amt) + ' 已自动均摊入账<br><span style="font-size:11.5px;opacity:.7">+5 家务币 · 下轮采购轮到' + esc(nm(S.buyTurn)) + '</span>');
    },
    addSupply: function () {
      var h = '<div class="fl">物品名称</div><input class="inp" id="spName" placeholder="例如：洗衣液">' +
        '<div class="fl">图标</div><div class="chips" id="spEmoji">' +
        ['🧴', '🧻', '🧼', '🧽', '🛍️', '🧺', '💡', '🔋', '☕', '🧂'].map(function (e, i) {
          return '<button class="ch' + (i === 0 ? ' on' : '') + '" data-e="' + e + '" onclick="A.pickOne(this,\'spEmoji\')" style="font-size:18px">' + e + '</button>';
        }).join('') + '</div>' +
        '<div class="fl">大约多久用完一瓶 / 一包</div><input class="inp" id="spCycle" type="number" value="30">' +
        '<div class="note-box">Roomly 会按这个周期和房间人数推算余量，在用完前提醒该买了，而不是等到发现没纸的那一刻。</div>' +
        '<button class="btn" onclick="A.doAddSupply()">添加</button>';
      sheet('添加公共物资', h);
    },
    doAddSupply: function () {
      var n = $('spName').value.trim();
      if (!n) { toast('请填写物品名称'); return; }
      S.supplies.push({
        id: 's' + Date.now(), name: n, emoji: $('spEmoji').querySelector('.on').dataset.e,
        stock: 100, cycle: parseInt($('spCycle').value) || 30, by: S.me, on: M + '月' + now.getDate() + '日', price: 30
      });
      closeSheet(); render(); toast('✅ 已加入公共物资清单');
    },

    /* 公约 */
    vote: function (id, yes) {
      var v = S.votes.filter(function (x) { return x.id === id; })[0];
      (yes ? v.yes : v.no).push(S.me);
      var need = Math.ceil(S.members.length * S.room.rule);
      if (v.yes.length >= need) {
        S.pacts.push({ id: 'p' + Date.now(), cat: v.cat, title: v.title, text: v.text, on: M + '月' + now.getDate() + '日', vote: v.yes.length + '/' + S.members.length });
        S.votes = S.votes.filter(function (x) { return x.id !== id; });
        render(); toast('🎉 提案通过，「' + esc(v.title) + '」已生效<br><span style="font-size:11.5px;opacity:.7">全员自动签署，新室友入住即适用</span>');
        return;
      }
      render();
      toast('🗳️ 已投' + (yes ? '同意' : '反对') + '，还差 ' + Math.max(0, need - v.yes.length) + ' 票生效');
    },
    propose: function () {
      var h = '<div class="fl">条款分类</div><div class="chips" id="pcCat">' +
        ['访客', '噪音', '清洁', '费用', '厨房', '宠物', '退租'].map(function (c, i) {
          return '<button class="ch' + (i === 0 ? ' on' : '') + '" data-c="' + c + '" onclick="A.pickOne(this,\'pcCat\')">' + c + '</button>';
        }).join('') + '</div>' +
        '<div class="fl">标题</div><input class="inp" id="pcTitle" placeholder="例如：阳台晾晒区域划分">' +
        '<div class="fl">条款内容</div>' +
        '<textarea class="inp" id="pcText" rows="4" style="resize:none;line-height:1.7" placeholder="写清楚：约定什么、谁负责、违反了怎么办"></textarea>' +
        '<div class="note-box">提案需要 ' + Math.ceil(S.members.length * S.room.rule) + '/' + S.members.length +
        ' 位室友同意才会生效。规则的合法性来自程序，而不是谁先住进来、谁嗓门大。</div>' +
        '<button class="btn" onclick="A.doPropose()">发起投票</button>';
      sheet('发起公约提案', h);
    },
    doPropose: function () {
      var t = $('pcTitle').value.trim(), x = $('pcText').value.trim();
      if (!t || !x) { toast('请填写标题和条款内容'); return; }
      S.votes.unshift({ id: 'v' + Date.now(), cat: $('pcCat').querySelector('.on').dataset.c, title: t, text: x, by: S.me, yes: [S.me], no: [] });
      closeSheet(); S.tab = 'pact'; render();
      toast('🗳️ 提案已发起，管家已通知全体室友投票');
    },

    /* 其他 */
    coinsInfo: function () {
      sheet('家务币怎么算', '<div class="pact" style="box-shadow:none;background:transparent;padding:0"><div class="tx">' +
        '完成值日：按耗时 <b>每 5 分钟 +1 币</b>（刷厕所 +5，倒垃圾 +1）<br>' +
        '代买公共物资：<b>+5 币</b>（跑腿本身也是付出）<br>' +
        '替室友接班：<b>获得该次家务的全部币</b><br>' +
        '垫付公共开销：结清后 <b>+2 币</b><br><br>' +
        '<b>它不产生任何强制力。</b>存在的意义只有一个：当有人心里冒出「凭什么总是我」的时候，给出一个可以核对的事实，而不是两个人的记忆互相打架。' +
        '</div></div>');
    },
    settings: function () {
      var h = '<div class="fl">室友 · ' + S.members.length + ' 人</div><div class="picker">';
      S.members.forEach(function (m) {
        h += '<div class="pick">' + avatar(m.id) + '<span class="nm">' + esc(m.name) + (isMe(m.id) ? '（我）' : '') +
          '<span style="display:block;font-size:11.5px;color:var(--ink3);font-weight:400">' + m.room + ' · 系数 ×' + m.factor + ' · ' + m.coins + ' 家务币</span></span></div>';
      });
      h += '</div>';
      h += '<div class="fl">房间设置</div><div class="card">' +
        '<div class="split-line"><span>公约通过门槛</span><span class="m">' + Math.ceil(S.members.length * S.room.rule) + ' / ' + S.members.length + '</span></div>' +
        '<div class="split-line"><span>账单结清截止日</span><span class="m">每月 10 日</span></div>' +
        '<div class="split-line"><span>催收方式</span><span class="m">管家统一提醒</span></div></div>';
      h += '<button class="btn ghost" onclick="A.invite()">邀请新室友</button>' +
        '<button class="btn line" onclick="A.tourStart()">重看功能讲解</button>' +
        '<button class="btn line" onclick="A.onbShow()">重看欢迎页</button>' +
        '<button class="btn line" onclick="A.reset()">重置演示数据</button>' +
        '<button class="btn line" onclick="A.resetAll()">恢复到「首次打开」状态</button>';
      sheet('房间设置', h);
    },
    invite: function () {
      closeSheet();
      toast('🔗 邀请链接已生成<br><span style="font-size:11.5px;opacity:.7">室友点开即可查看账单并确认，无需注册下载</span>');
    },
    reset: function () {
      try { localStorage.removeItem(LS); } catch (e) { }
      S = seed();
      S.shifts.forEach(function (s) { s.done = s.day < todayNum; });
      ensureTodayTask();
      closeSheet(); render();
      toast('↺ 演示数据已恢复初始状态');
    },
    resetAll: function () {
      try { localStorage.removeItem(LS); localStorage.removeItem(SEEN); } catch (e) { }
      S = seed();
      S.shifts.forEach(function (s) { s.done = s.day < todayNum; });
      ensureTodayTask();
      tourEnd(); closeSheet(); S.tab = 'home'; render();
      try { localStorage.removeItem(SEEN); } catch (e) { }
      showOnb();
    }
  };
  window.A = A;

  /* ---------- 事件 ---------- */
  $('tabbar').addEventListener('click', function (e) {
    var t = e.target.closest('.tab'); if (!t) return;
    S.tab = t.dataset.tab; render();
  });
  $('onb').addEventListener('click', function (e) {
    var b = e.target.closest('.onb-i');
    if (b) { A.onbGo(b.dataset.go); return; }
    var f = e.target.closest('[data-onb]');
    if (f) A.onbGo(f.dataset.onb);
  });
  $('tour').addEventListener('click', function (e) {
    var b = e.target.closest('[data-t]');
    if (!b) return;
    var t = b.dataset.t;
    if (t === 'skip') { tourEnd(); render(); }
    else if (t === 'prev') tourShow(tourI - 1);
    else tourShow(tourI + 1);
  });
  $('mask').addEventListener('click', closeSheet);
  $('sheetClose').addEventListener('click', closeSheet);
  var rb = $('resetBtn2'); if (rb) rb.addEventListener('click', function () { A.reset(); });

  function clock() {
    var d = new Date();
    $('clock').textContent = d.getHours() + ':' + String(d.getMinutes()).padStart(2, '0');
  }
  clock(); setInterval(clock, 20000);

  // 深链接：?tab=bills&sheet=settle
  try {
    var q = new URLSearchParams(location.search);
    if (q.get('tab') && VIEWS[q.get('tab')]) S.tab = q.get('tab');
    render();
    var sh = q.get('sheet');
    if (sh && A[sh]) A[sh]();
    var seen = false;
    try { seen = !!localStorage.getItem(SEEN); } catch (e) { }
    if (!seen && !sh && !q.get('tab')) showOnb();
    if (q.get('onb')) showOnb();
  } catch (e) { render(); }
})();
