import React, { useEffect, useMemo, useState } from 'react';
import {
  Trophy, Users, CalendarDays, Radio, ShieldCheck, Menu, X,
  ArrowUpRight, Camera, LogIn, LogOut, Plus, Check, XCircle, Award, MapPin
} from 'lucide-react';
import { supabase } from './supabase';

const bakkarPlayers = [
  'Rupesh Matre','Rajesh Matre','Pradip Matre','Jitendra Matre',
  'Lokesh Matre','Ganesh Maneshwar','Rohit Matre','Sudam Nageshwar',
  'Mayur Matre','Rahul Panche','Rohan Matre','Mohit Bahe',
  'Vikash Khare','Sujal Panche','Nikesh Matre','Ankush Panche',
  'Sunil Shendre','Lokesh Kawre','Tikesh Matre','Satish Matre',
  'Temchand Kawre','Anil Bahe'
];

const initialTeam = {
  name: 'Bakkar',
  captain: 'Dharam Das Matre',
  captain_mobile: '',
  vice_captain: 'Akshay Bahe',
  vice_captain_mobile: '',
  players: bakkarPlayers.map(name => ({ name, mobile: '' }))
};

const money = n => `₹${Number(n || 0).toLocaleString('en-IN')}`;

export default function App() {
  const [lang, setLang] = useState('EN');
  const [tab, setTab] = useState('Home');
  const [menu, setMenu] = useState(false);
  const [teams, setTeams] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [login, setLogin] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [reg, setReg] = useState({
    name: '',
    captain: '',
    captain_mobile: '',
    vice_captain: '',
    vice_captain_mobile: '',
    players: ''
  });

  const [newMatch, setNewMatch] = useState({
    team_a: '',
    team_b: '',
    date: '2026-11-02',
    overs: 8,
    venue: 'Bakkar'
  });

  const [scoreForm, setScoreForm] = useState({
    runs: 0,
    wickets: 0,
    overs: '0.0',
    status: 'Live'
  });

  const t = (en, hi) => lang === 'EN' ? en : hi;

  const adminEmail =
    import.meta.env.VITE_ADMIN_EMAIL || 'admin@example.com';

  useEffect(() => {
    if (!supabase) return;

    refresh();

    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user || null);
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_e, s) => {
      setUser(s?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function refresh() {
    if (!supabase) return;

    setLoading(true);

    const [a, b] = await Promise.all([
      supabase
        .from('teams')
        .select('id,name,captain,vice_captain,players,approved,created_at')
        .eq('approved', true)
        .order('created_at'),

      supabase
        .from('matches')
        .select('*')
        .order('match_date')
    ]);

    if (!a.error) setTeams(a.data || []);
    if (!b.error) setMatches(b.data || []);

    setLoading(false);
  }

  async function registerTeam(e) {
    e.preventDefault();
    setNotice('');

    if (!supabase) {
      setNotice('Database setup required. Follow SETUP.md to connect Supabase.');
      return;
    }

    const players = reg.players
      .split('\n')
      .map(x => x.trim())
      .filter(Boolean)
      .map(name => ({ name, mobile: '' }));

    if (players.length < 11) {
      setNotice('कम से कम 11 खिलाड़ियों के नाम दर्ज करें।');
      return;
    }

    const { error } = await supabase
      .from('teams')
      .insert({ ...reg, players, approved: false });

    setNotice(
      error
        ? error.message
        : 'Registration submitted! Admin approval के बाद टीम दिखाई देगी।'
    );

    if (!error) {
      setReg({
        name: '',
        captain: '',
        captain_mobile: '',
        vice_captain: '',
        vice_captain_mobile: '',
        players: ''
      });
    }
  }

  async function signIn(e) {
    e.preventDefault();
    setError('');

    if (login.username.trim() !== 'admin') {
      setError('Username must be admin.');
      return;
    }

    if (!supabase) {
      setError('Supabase configuration missing.');
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: adminEmail,
      password: login.password
    });

    if (error) {
      setError(error.message);
    } else {
      setLoginOpen(false);
      setLogin({ username: '', password: '' });
      setTab('Admin');
    }
  }

  async function signOut() {
    await supabase?.auth.signOut();
    setUser(null);
    setTab('Home');
  }

  async function approve(id, approved) {
    const { error } = await supabase
      .from('teams')
      .update({ approved })
      .eq('id', id);

    if (error) {
      setNotice(error.message);
    } else {
      setNotice(approved ? 'Team approved.' : 'Team rejected.');
      refresh();
    }
  }

  async function addMatch(e) {
    e.preventDefault();

    const { error } = await supabase
      .from('matches')
      .insert({
        ...newMatch,
        match_date: newMatch.date,
        match_status: 'Upcoming',
        runs: 0,
        wickets: 0,
        overs_completed: '0.0'
      });

    setNotice(error ? error.message : 'Match added.');

    if (!error) {
      refresh();
      setNewMatch({
        ...newMatch,
        team_a: '',
        team_b: ''
      });
    }
  }

  async function updateScore(id) {
    const { error } = await supabase
      .from('matches')
      .update({
        runs: Number(scoreForm.runs),
        wickets: Number(scoreForm.wickets),
        overs_completed: scoreForm.overs,
        match_status: scoreForm.status
      })
      .eq('id', id);

    setNotice(error ? error.message : 'Score updated.');

    if (!error) refresh();
  }

  const pendingLabel = useMemo(() => teams.length, [teams]);

  const nav = ['Home', 'Teams', 'Fixtures', 'Live Score', 'Register'];

  return (
    <div className="app">

      <div className="topline">
        <span><MapPin size={13} /> Bakkar, Maharashtra</span>
        <span>
          2–15 November 2026 <b>•</b>{' '}
          {t('Village Cricket, Big Passion', 'गाँव का क्रिकेट, बड़ा जुनून')}
        </span>
      </div>

      <header className="header">

        <a
          className="brand"
          href="#home"
          onClick={() => setTab('Home')}
        >
          <div className="brandball">🏏</div>
          <div>
            <strong>BAKKAR <em>CRICKET</em></strong>
            <small>TOURNAMENT 2026</small>
          </div>
        </a>

        <nav>
          {nav.map(n => (
            <button
              className={tab === n ? 'active' : ''}
              key={n}
              onClick={() => setTab(n)}
            >
              {n === 'Live Score' && <Radio size={15} />} {n}
            </button>
          ))}

          {user && (
            <button onClick={() => setTab('Admin')}>
              Admin
            </button>
          )}
        </nav>

        <div className="head-actions">

          <button
            className="lang"
            onClick={() => setLang(lang === 'EN' ? 'HI' : 'EN')}
          >
            {lang === 'EN' ? 'हिंदी' : 'EN'}
          </button>

          {user ? (
            <button className="adminbtn" onClick={signOut}>
              <LogOut size={15} /> Logout
            </button>
          ) : (
            <button
              className="adminbtn"
              onClick={() => setLoginOpen(true)}
            >
              <ShieldCheck size={15} /> Admin
            </button>
          )}

          <button
            className="hamb"
            onClick={() => setMenu(!menu)}
          >
            {menu ? <X /> : <Menu />}
          </button>

        </div>
      </header>

      {menu && (
        <div className="mobilemenu">
          {[...nav, 'Admin'].map(n => (
            <button
              key={n}
              onClick={() => {
                setTab(n);
                setMenu(false);
              }}
            >
              {n}
            </button>
          ))}
        </div>
      )}

      {/* HOME PAGE */}

      {tab === 'Home' && (
        <>
          <section className="hero" id="home">

            <div className="hero-copy">

              <div className="eyebrow">
                <span className="pulse" />
                {t(
                  'THE BIGGEST LOCAL CRICKET EVENT',
                  'गाँव का सबसे बड़ा क्रिकेट टूर्नामेंट'
                )}
              </div>

              <h1>
                PLAY WITH<br />
                <span>PRIDE.</span> WIN WITH<br />
                PASSION.
              </h1>

              <p>
                {t(
                  'The village comes together for the spirit of cricket. Be ready for an unforgettable tournament.',
                  'क्रिकेट के जुनून के साथ पूरा गाँव एक साथ। एक यादगार टूर्नामेंट के लिए तैयार रहें।'
                )}
              </p>

              <div className="hero-buttons">
                <button
                  className="primary"
                  onClick={() => setTab('Register')}
                >
                  {t('REGISTER YOUR TEAM', 'टीम रजिस्टर करें')}
                  <ArrowUpRight size={17} />
                </button>

                <button
                  className="outline"
                  onClick={() => setTab('Fixtures')}
                >
                  {t('VIEW FIXTURES', 'मैच देखें')}
                </button>
              </div>

              <div className="hero-stats">
                <div>
                  <b>₹31K</b>
                  <small>1ST PRIZE</small>
                </div>
                <div>
                  <b>₹15K</b>
                  <small>2ND PRIZE</small>
                </div>
                <div>
                  <b>₹1,200</b>
                  <small>ENTRY FEE</small>
                </div>
              </div>

            </div>

            <div className="hero-art">
              <div className="orbit orbit1" />
              <div className="orbit orbit2" />
              <div className="bigball">🏏</div>

              <div className="date-card">
                <CalendarDays />
                <span>
                  <b>02 NOV</b>
                  <small>TOURNAMENT STARTS</small>
                </span>
              </div>

              <div className="prize-card">
                <Trophy />
                <span>
                  <b>₹31,000</b>
                  <small>WINNER PRIZE</small>
                </span>
              </div>

              <div className="hero-tag">
                EST. 2026<br />
                <strong>LET'S PLAY!</strong>
              </div>

            </div>
          </section>

          <section className="ticker">
            <span>🏆 BAKKAR CRICKET TOURNAMENT 2026</span>
            <span>•</span>
            <span>LEAGUE • QUARTER FINAL • SEMI FINAL • FINAL</span>
            <span>•</span>
            <span>🏏 PLAY HARD, PLAY FAIR</span>
          </section>

          <section className="section">

            <div className="section-head">
              <div>
                <div className="kicker">TOURNAMENT OVERVIEW</div>
                <h2>{t('THE BATTLE BEGINS', 'मुकाबला शुरू होता है')}</h2>
              </div>

              <p>
                {t(
                  'A celebration of cricket, teamwork and community.',
                  'क्रिकेट, टीमवर्क और गाँव की एकता का उत्सव।'
                )}
              </p>
            </div>

            <div className="overview-grid">

              <div className="info-card">
                <CalendarDays />
                <small>START DATE</small>
                <b>02 NOV 2026</b>
                <span>League matches begin</span>
              </div>

              <div className="info-card">
                <Trophy />
                <small>WINNER PRIZE</small>
                <b>₹31,000</b>
                <span>First prize</span>
              </div>

              <div className="info-card">
                <Award />
                <small>RUNNER-UP</small>
                <b>₹15,000</b>
                <span>Second prize</span>
              </div>

              <div className="info-card">
                <Users />
                <small>ENTRY FEE</small>
                <b>₹1,200</b>
                <span>Per team</span>
              </div>

            </div>
          </section>

          <section className="feature-band">

            <div>
              <div className="kicker">HOST TEAM</div>
              <h2>ONE TEAM.<br /><span>ONE DREAM.</span></h2>

              <p>
                Bakkar — the host team, ready to defend home ground
                and meet the semi-final winner in the grand final.
              </p>

              <button
                className="primary"
                onClick={() => setTab('Teams')}
              >
                EXPLORE TEAMS <ArrowUpRight size={16} />
              </button>
            </div>

            <div className="host-crest">
              <div className="crest">B<span>🏏</span></div>
              <b>BAKKAR</b>
              <small>HOST TEAM • 2026</small>
            </div>

          </section>
        </>
      )}

      {/* TEAMS PAGE */}

      {tab === 'Teams' && (
        <section className="section page-section">

          <div className="kicker">SQUADS & PLAYERS</div>
          <h2>TOURNAMENT TEAMS</h2>
          <p className="muted">
            Approved teams and their complete squads.
          </p>

          <div className="team-grid">

            <article className="team-card host-team">

              <div className="team-banner">
                🏏<span>HOST TEAM</span>
              </div>

              <h3>BAKKAR</h3>
              <p><b>Captain:</b> Dharam Das Matre</p>
              <p><b>Vice Captain:</b> Akshay Bahe</p>

              <div className="player-list">
                {bakkarPlayers.map((p, i) => (
                  <div key={p}>
                    <span className="avatar">
                      {p.split(' ').map(x => x[0]).join('').slice(0, 2)}
                    </span>
                    {p}
                    <small>{i < 11 ? 'SQUAD' : 'RESERVE'}</small>
                  </div>
                ))}
              </div>

            </article>

            {teams.map(team => (
              <article className="team-card" key={team.id}>

                <div className="team-banner">🏏</div>

                <h3>{team.name}</h3>
                <p><b>Captain:</b> {team.captain}</p>
                <p><b>Vice Captain:</b> {team.vice_captain}</p>

                <div className="player-list">
                  {(team.players || []).map((p, i) => (
                    <div key={i}>
                      <span className="avatar">
                        {p.name?.slice(0, 2).toUpperCase()}
                      </span>
                      {p.name}
                      <small>{i < 11 ? 'SQUAD' : 'RESERVE'}</small>
                    </div>
                  ))}
                </div>

              </article>
            ))}

          </div>

          {!teams.length && (
            <p className="empty">
              Other approved teams will appear here after registration.
            </p>
          )}

        </section>
      )}

      {/* FIXTURES PAGE */}

      {tab === 'Fixtures' && (
        <section className="section page-section">

          <div className="kicker">MATCH CENTRE</div>
          <h2>FIXTURES & RESULTS</h2>
          <p className="muted">
            League → Quarter Final → Semi Final → Grand Final
          </p>

          <div className="fixture-card">
            <div className="fixture-date">
              02 NOV 2026 <span>LEAGUE STAGE</span>
            </div>
            <h3>League matches begin</h3>
            <p>
              Match schedule will be published by tournament management.
            </p>
          </div>

          <div className="fixture-card">
            <div className="fixture-date">
              15 NOV 2026 <span>SEMI FINAL</span>
            </div>
            <h3>Semi-final</h3>
            <p>
              Qualified teams compete for a place in the final.
            </p>
          </div>

          <div className="fixture-card highlight">
            <div className="fixture-date">
              15 NOV 2026 <span>GRAND FINAL</span>
            </div>
            <h3>BAKKAR <i>VS</i> SEMI-FINAL WINNER</h3>
            <p>
              Host team Bakkar takes on the semi-final winner.
            </p>
          </div>

          {matches.map(m => (
            <div className="fixture-card" key={m.id}>
              <div className="fixture-date">
                {m.match_date} <span>{m.match_status}</span>
              </div>
              <h3>{m.team_a} <i>VS</i> {m.team_b}</h3>
              <p>{m.venue} • {m.overs} overs</p>
            </div>
          ))}

        </section>
      )}

      {/* LIVE SCORE PAGE */}

      {tab === 'Live Score' && (
        <section className="section page-section">

          <div className="kicker">
            <span className="pulse" /> LIVE MATCH CENTRE
          </div>

          <h2>LIVE SCORES</h2>
          <p className="muted">
            Follow match updates from the ground.
          </p>

          {matches
            .filter(m => m.match_status === 'Live')
            .map(m => (
              <div className="score-card" key={m.id}>

                <div className="live-label">● LIVE</div>

                <h3>
                  {m.team_a} <span>VS</span> {m.team_b}
                </h3>

                <div className="score-number">
                  {m.runs || 0}/{m.wickets || 0}
                </div>

                <p>
                  {m.overs_completed || '0.0'} overs • {m.overs} overs
                </p>

              </div>
            ))}

          {!matches.some(m => m.match_status === 'Live') && (
            <div className="empty live-empty">
              <Radio size={30} />
              <b>No live match right now</b>
              <span>
                Live score will appear here when the scorer starts a match.
              </span>
            </div>
          )}

        </section>
      )}

      {/* REGISTER PAGE */}

      {tab === 'Register' && (
        <section className="section page-section">

          <div className="kicker">JOIN THE TOURNAMENT</div>
          <h2>REGISTER YOUR TEAM</h2>

          <p className="muted">
            Submit your team details. Admin approval is required
            before your team appears publicly.
          </p>

          <form className="form-card" onSubmit={registerTeam}>

            <label>
              Team Name
              <input
                required
                value={reg.name}
                onChange={e => setReg({ ...reg, name: e.target.value })}
                placeholder="Enter team name"
              />
            </label>

            <div className="form-row">

              <label>
                Captain Name
                <input
                  required
                  value={reg.captain}
                  onChange={e => setReg({ ...reg, captain: e.target.value })}
                  placeholder="Captain full name"
                />
              </label>

              <label>
                Captain Mobile
                <input
                  required
                  type="tel"
                  pattern="[0-9]{10}"
                  value={reg.captain_mobile}
                  onChange={e =>
                    setReg({ ...reg, captain_mobile: e.target.value })
                  }
                  placeholder="10-digit mobile"
                />
              </label>

            </div>

            <div className="form-row">

              <label>
                Vice Captain Name
                <input
                  required
                  value={reg.vice_captain}
                  onChange={e =>
                    setReg({ ...reg, vice_c
