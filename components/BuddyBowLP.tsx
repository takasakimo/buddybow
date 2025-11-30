"use client";

import React, { useState, useEffect } from 'react';

import { 

  ArrowRight, 

  CheckCircle2, 

  Users, 

  ShieldCheck, 

  TrendingUp, 

  BookOpen, 

  HeartHandshake,

  Compass,

  Sparkles,

  ShoppingBag,

  Smartphone,

  Shirt,

  Menu,

  X,

  ChevronDown,

  HelpCircle,

  Calendar,

  Flag,

  Video,

  Layers,

  PlayCircle

} from 'lucide-react';



const BuddyBowLP = () => {

  const [scrolled, setScrolled] = useState(false);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);



  // Scroll detection for header styling

  useEffect(() => {

    const handleScroll = () => {

      setScrolled(window.scrollY > 50);

    };

    window.addEventListener('scroll', handleScroll);

    return () => window.removeEventListener('scroll', handleScroll);

  }, []);



  // Smooth scroll handler

  const scrollToSection = (id: string) => {

    setMobileMenuOpen(false);

    const element = document.getElementById(id);

    if (element) {

      element.scrollIntoView({ behavior: 'smooth' });

    }

  };



  const toggleFaq = (index: number) => {

    setOpenFaqIndex(openFaqIndex === index ? null : index);

  };



  return (

    <div className="font-sans text-stone-700 bg-[#FAF9F6] overflow-x-hidden selection:bg-[#DDB892] selection:text-white">

      

      {/* Navigation */}

      <nav 

        className={`fixed w-full z-50 transition-all duration-300 ${

          scrolled ? 'bg-white/90 backdrop-blur-md shadow-sm py-3' : 'bg-transparent py-5'

        }`}

      >

        <div className="container mx-auto px-6 flex justify-between items-center">

          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>

            <span className="text-2xl font-bold tracking-tight text-[#B08968]">buddybow</span>

          </div>

          

          {/* Desktop Menu */}

          <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-stone-600">

            <button onClick={() => scrollToSection('problems')} className="hover:text-[#B08968] transition-colors">3つの壁</button>

            <button onClick={() => scrollToSection('contents')} className="hover:text-[#B08968] transition-colors">学習講座</button>

            <button onClick={() => scrollToSection('method')} className="hover:text-[#B08968] transition-colors">独自メソッド</button>

            <button onClick={() => scrollToSection('contact')} className="px-5 py-2.5 bg-[#B08968] text-white rounded-full hover:bg-[#9c7858] transition-all transform hover:scale-105 shadow-md">

              無料相談はこちら

            </button>

          </div>



          {/* Mobile Menu Button */}

          <button 

            className="md:hidden text-stone-600"

            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}

          >

            {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}

          </button>

        </div>



        {/* Mobile Menu Overlay */}

        {mobileMenuOpen && (

          <div className="md:hidden absolute top-full left-0 w-full bg-white shadow-lg py-6 px-6 flex flex-col space-y-4 border-t border-stone-100">

            <button onClick={() => scrollToSection('problems')} className="text-left py-2 border-b border-stone-100">3つの壁</button>

            <button onClick={() => scrollToSection('contents')} className="text-left py-2 border-b border-stone-100">学習講座</button>

            <button onClick={() => scrollToSection('method')} className="text-left py-2 border-b border-stone-100">独自メソッド</button>

            <button onClick={() => scrollToSection('contact')} className="mt-4 w-full py-3 bg-[#B08968] text-white rounded-lg text-center font-bold">

              無料相談はこちら

            </button>

          </div>

        )}

      </nav>



      {/* Hero Section */}

      <header className="relative min-h-screen flex items-center pt-20 overflow-hidden">

        {/* Abstract Background Shapes */}

        <div className="absolute top-0 right-0 w-full md:w-2/3 h-full bg-[#F5EFE6] -z-10 rounded-bl-[100px] md:rounded-bl-[150px] opacity-70"></div>

        <div className="absolute bottom-20 left-10 w-64 h-64 bg-[#E6CCB2] rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>

        <div className="absolute top-40 right-20 w-80 h-80 bg-[#DDB892] rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '2s' }}></div>



        <div className="container mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">

          <div className="space-y-8 animate-fade-in-up z-10">

            <div className="inline-block px-4 py-1.5 bg-white border border-[#E6CCB2] rounded-full text-sm text-[#B08968] font-medium shadow-sm mb-2">

              伴走型リブートプログラム

            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-stone-800">

              副業を、もう一度、<br />

              <span className="text-[#B08968]">ちゃんと始められる</span><br />

              場所。

            </h1>

            <p className="text-lg md:text-xl text-stone-600 leading-relaxed max-w-lg">

              知識ゼロからのスタートも、再挑戦のリブートも。<br />

              科学的アプローチと伴走で、<br />

              「自走できる自分」へあなたを変革します。

            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">

              <button onClick={() => scrollToSection('contact')} className="px-8 py-4 bg-[#B08968] text-white rounded-full font-bold text-lg hover:bg-[#9c7858] transition-all transform hover:-translate-y-1 shadow-lg flex items-center justify-center gap-2 group">

                まずは無料相談へ

                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />

              </button>

            </div>

            <p className="text-xs text-stone-500 ml-2">※無理な勧誘は一切ありません。あなたの現在地を知るための時間です。</p>

          </div>



          <div className="relative h-[400px] md:h-[500px] hidden md:block animate-fade-in">

            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-[500px]">

              {/* Main Image: 壮大な山脈（高みを目指すイメージ） */}

              <div className="absolute top-0 right-0 md:right-4 lg:right-10 w-64 md:w-72 lg:w-80 h-[350px] md:h-[400px] lg:h-[450px] rounded-[40px] overflow-hidden shadow-2xl z-10 rotate-3 hover:rotate-0 transition-all duration-700 bg-stone-200">

                <img 

                  src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80" 

                  alt="高みを目指す山脈の風景" 

                  className="w-full h-full object-cover"

                />

              </div>

              {/* Sub Image: 道しるべ・光（伴走のイメージ） */}

              <div className="absolute top-32 right-32 md:right-40 lg:right-60 w-48 md:w-56 lg:w-64 h-48 md:h-56 lg:h-64 rounded-[30px] overflow-hidden shadow-xl z-20 border-8 border-white -rotate-6 hover:rotate-0 transition-all duration-700 bg-stone-100">

                <img 

                  src="https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=600&q=80" 

                  alt="希望の光が差す朝の野原" 

                  className="w-full h-full object-cover"

                />

              </div>

              <div className="absolute bottom-10 right-40 md:right-52 lg:right-80 bg-white p-4 rounded-2xl shadow-lg z-30 flex items-center gap-3 animate-bounce-slow max-w-[200px]">

                <div className="bg-green-100 p-2 rounded-full text-green-600 shrink-0">

                  <TrendingUp size={24} />

                </div>

                <div>

                  <p className="text-xs text-stone-500 whitespace-nowrap">週次リブート</p>

                  <p className="text-sm font-bold text-stone-800 whitespace-nowrap">行動継続率UP</p>

                </div>

              </div>

            </div>

          </div>

        </div>

        

        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 animate-bounce text-[#B08968]">

          <ChevronDown size={32} />

        </div>

      </header>



      {/* Checklist Section: ターゲットの自分事化 */}

      <section className="py-16 bg-white relative z-20 -mt-10 mx-4 md:mx-auto max-w-5xl rounded-3xl shadow-xl border border-stone-100">

        <div className="px-6 md:px-12 text-center">

          <h2 className="text-2xl font-bold text-stone-800 mb-8 flex items-center justify-center gap-3">

            <span className="text-[#B08968]">Check</span>

            こんな「消化不良」を感じていませんか？

          </h2>

          <div className="grid md:grid-cols-2 gap-6 text-left">

            {[

              "教材を買っただけで満足してしまい、結局実践できていない",

              "「失敗したくない」と考えすぎて、準備ばかりに時間を使っている",

              "情報は集めているが、どれが自分に合っているか分からない",

              "困った時に相談できる相手がおらず、手が止まってしまう",

              "「やる気」に頼ってしまい、モチベーションの波に疲れている"

            ].map((item, idx) => (

              <div key={idx} className="flex items-start gap-3 bg-[#FAF9F6] p-4 rounded-xl">

                <div className="bg-[#B08968] text-white rounded-full p-1 mt-0.5 shrink-0">

                  <CheckCircle2 size={16} />

                </div>

                <span className="text-stone-700 font-medium">{item}</span>

              </div>

            ))}

          </div>

          <p className="mt-8 text-stone-600">

            これらは、あなたの能力不足ではありません。<br/>

            <span className="font-bold text-[#B08968]">「行動するための仕組み」</span>が足りていないだけなのです。

          </p>

        </div>

      </section>



      {/* Problem Section: 3つの壁 */}

      <section id="problems" className="py-24 bg-[#FAF9F6]">

        <div className="container mx-auto px-6">

          <div className="text-center max-w-2xl mx-auto mb-16">

            <span className="text-[#B08968] font-bold tracking-wider uppercase text-sm">Why Stuck?</span>

            <h2 className="text-3xl md:text-4xl font-bold text-stone-800 mt-2 mb-6">副業に挑戦できない「3つの壁」</h2>

          </div>



          <div className="grid md:grid-cols-3 gap-8">

            <div className="bg-white p-8 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 border border-transparent hover:border-[#E6CCB2] flex flex-col h-full transform hover:-translate-y-1">

              <div className="w-16 h-16 bg-[#FFF8F0] rounded-2xl flex items-center justify-center text-[#B08968] mb-6">

                <BookOpen size={32} />

              </div>

              <h3 className="text-xl font-bold text-stone-800 mb-3">1. 情報過多の罠</h3>

              <p className="text-stone-600 text-sm leading-relaxed flex-grow">

                「もっと勉強しなければ」「この情報も必要かも」と知識を集めることが目的化し、実際の行動に移れない状態。

              </p>

            </div>



            <div className="bg-white p-8 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 border border-transparent hover:border-[#E6CCB2] flex flex-col h-full transform hover:-translate-y-1">

              <div className="w-16 h-16 bg-[#FFF8F0] rounded-2xl flex items-center justify-center text-[#B08968] mb-6">

                <ShieldCheck size={32} />

              </div>

              <h3 className="text-xl font-bold text-stone-800 mb-3">2. 完璧主義の壁</h3>

              <p className="text-stone-600 text-sm leading-relaxed flex-grow">

                「失敗したくない」「完璧な準備をしてから」という思いが強すぎて、最初の一歩が踏み出せない状態。

              </p>

            </div>



            <div className="bg-white p-8 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 border border-transparent hover:border-[#E6CCB2] flex flex-col h-full transform hover:-translate-y-1">

              <div className="w-16 h-16 bg-[#FFF8F0] rounded-2xl flex items-center justify-center text-[#B08968] mb-6">

                <Users size={32} />

              </div>

              <h3 className="text-xl font-bold text-stone-800 mb-3">3. 孤独な挑戦</h3>

              <p className="text-stone-600 text-sm leading-relaxed flex-grow">

                「迷ったときに相談できる人がいない」環境で、小さな躓きでモチベーションを維持できなくなってしまう状態。

              </p>

            </div>

          </div>

        </div>

      </section>



      {/* Solution Section */}

      <section className="py-24 bg-[#B08968] text-white relative overflow-hidden">

        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>

        <div className="container mx-auto px-6 relative z-10">

          <div className="text-center max-w-3xl mx-auto mb-16">

            <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">

              「教える」から「伴走する」へ

            </h2>

            <p className="text-white/90 text-lg leading-relaxed">

              私たちの役割は、知識を教える講師ではありません。<br/>

              あなたの隣で、行動が止まる原因を特定し、<br className="hidden md:block"/>

              小さな一歩を共に踏み出す「相棒 (buddy)」です。

            </p>

          </div>



          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">

            <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20 text-center">

              <div className="text-white/70 font-bold mb-2">一般的なスクール</div>

              <div className="text-2xl font-bold mb-4 opacity-50 line-through">教材提供型</div>

              <p className="text-sm text-white/80">

                「動画を見てやっておいてください」<br/>

                一方的な情報提供で、自己解決が前提。

              </p>

            </div>

            <div className="bg-white text-[#B08968] rounded-3xl p-8 shadow-2xl text-center transform scale-105 relative">

              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-[#B08968] text-white px-4 py-1 rounded-full text-xs font-bold border-2 border-white">

                buddybow

              </div>

              <div className="text-[#B08968] font-bold mb-2">私たちが提供するもの</div>

              <div className="text-3xl font-bold mb-4 flex items-center justify-center gap-2">

                <HeartHandshake /> 伴走型

              </div>

              <p className="text-sm font-medium">

                週次の行動指針設定と振り返りで、<br/>

                迷う時間をゼロにし、行動を継続させる。

              </p>

            </div>

          </div>

        </div>

      </section>



      {/* New Content Section: 学習コンテンツの訴求 */}

      <section id="contents" className="py-24 bg-white relative">

        <div className="container mx-auto px-6">

          <div className="flex flex-col md:flex-row gap-12 items-center">

            <div className="md:w-1/2">

              <span className="text-[#B08968] font-bold tracking-wider uppercase text-sm">Learning Contents</span>

              <h2 className="text-3xl md:text-4xl font-bold text-stone-800 mt-2 mb-6">

                知識ゼロからでも安心。<br/>

                <span className="text-[#B08968]">100以上のオリジナル講座</span>が見放題

              </h2>

              <p className="text-stone-600 leading-relaxed mb-6">

                「何から学べばいいか分からない」という初心者の方も、「基礎から学び直したい」という経験者の方も安心してください。

              </p>

              <p className="text-stone-600 leading-relaxed mb-8">

                副業の基礎知識から、各ジャンルの専門スキル、マインドセットまで。

                100本以上の動画講義・テキスト教材を完備しています。

                もちろん、あなた専属のバディが「今必要な講座」をピックアップして案内するため、

                膨大な情報の中で迷子になることはありません。

              </p>

              

              <div className="grid grid-cols-2 gap-4">

                <div className="flex items-center gap-3 bg-[#FAF9F6] p-4 rounded-xl border border-stone-100">

                  <div className="p-2 bg-white rounded-lg text-[#B08968] shadow-sm"><Video size={20} /></div>

                  <span className="text-sm font-bold text-stone-700">動画講義</span>

                </div>

                <div className="flex items-center gap-3 bg-[#FAF9F6] p-4 rounded-xl border border-stone-100">

                  <div className="p-2 bg-white rounded-lg text-[#B08968] shadow-sm"><BookOpen size={20} /></div>

                  <span className="text-sm font-bold text-stone-700">テキスト教材</span>

                </div>

                <div className="flex items-center gap-3 bg-[#FAF9F6] p-4 rounded-xl border border-stone-100">

                  <div className="p-2 bg-white rounded-lg text-[#B08968] shadow-sm"><Layers size={20} /></div>

                  <span className="text-sm font-bold text-stone-700">テンプレート</span>

                </div>

                <div className="flex items-center gap-3 bg-[#FAF9F6] p-4 rounded-xl border border-stone-100">

                  <div className="p-2 bg-white rounded-lg text-[#B08968] shadow-sm"><PlayCircle size={20} /></div>

                  <span className="text-sm font-bold text-stone-700">24時間視聴可能</span>

                </div>

              </div>

            </div>

            <div className="md:w-1/2 relative">

               <div className="absolute -top-4 -right-4 w-32 h-32 bg-[#E6CCB2] rounded-full opacity-30 z-0"></div>

               {/* Content Image: 学習風景（手元やデバイス） */}

               <img 

                src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 

                alt="オンライン学習の様子" 

                className="rounded-[40px] shadow-xl relative z-10 w-full object-cover h-[400px]"

              />

            </div>

          </div>

        </div>

      </section>



      {/* Method Section: 独自メソッドの詳細 */}

      <section id="method" className="py-24 bg-[#FAF9F6]">

        <div className="container mx-auto px-6">

          <div className="text-center max-w-3xl mx-auto mb-20">

            <span className="text-[#B08968] font-bold tracking-wider uppercase text-sm">Our Method</span>

            <h2 className="text-3xl md:text-4xl font-bold text-stone-800 mt-2 mb-6">

              <span className="text-[#B08968]">最大256パターン</span>から導く<br/>

              科学的アプローチ

            </h2>

            <p className="text-stone-600">

              根性論ではありません。NLP（神経言語プログラミング）と行動心理学に基づき、<br className="hidden md:block"/>

              「あなたが自然と動けるようになる仕組み」を構築します。

            </p>

          </div>



          <div className="grid md:grid-cols-2 gap-12 items-center mb-24">

            <div className="space-y-8">

              <div className="flex gap-4">

                <div className="w-12 h-12 bg-[#B08968] text-white rounded-xl flex items-center justify-center font-bold text-xl shrink-0">01</div>

                <div>

                  <h3 className="text-xl font-bold text-stone-800 mb-2">行動を止める「ブレーキ」の特定</h3>

                  <p className="text-stone-600 text-sm leading-relaxed">

                    なぜ動けないのか？ 行動心理学に基づき、あなたの思考のクセや心理的バリアを診断します。

                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">

                    <span className="px-3 py-1 bg-white border border-stone-200 rounded-full text-xs text-stone-600">行動タイプ診断</span>

                    <span className="px-3 py-1 bg-white border border-stone-200 rounded-full text-xs text-stone-600">認知パターン診断</span>

                    <span className="px-3 py-1 bg-white border border-stone-200 rounded-full text-xs text-stone-600">生活リズム診断</span>

                  </div>

                </div>

              </div>



              <div className="flex gap-4">

                <div className="w-12 h-12 bg-[#B08968] text-white rounded-xl flex items-center justify-center font-bold text-xl shrink-0">02</div>

                <div>

                  <h3 className="text-xl font-bold text-stone-800 mb-2">完全個別ロードマップの作成</h3>

                  <p className="text-stone-600 text-sm leading-relaxed mb-4">

                    テンプレートではありません。診断結果に基づき、あなたの特性に合わせた「90日間の具体的な行動計画」をマインドマップ形式で設計します。

                  </p>

                  {/* ロードマップイメージ図 */}

                  <div className="bg-white p-4 rounded-2xl border border-[#E6CCB2] relative overflow-hidden shadow-sm inline-block">

                    <div className="flex items-center gap-2 mb-2 text-[#B08968] font-bold text-xs uppercase">

                      <Compass size={14} /> Roadmap Image

                    </div>

                    <div className="flex gap-1 text-[10px] text-stone-500 font-medium items-center">

                      <span className="bg-stone-100 px-2 py-1 rounded">診断</span>

                      <ArrowRight size={10} />

                      <span className="bg-stone-100 px-2 py-1 rounded">戦略</span>

                      <ArrowRight size={10} />

                      <span className="bg-stone-100 px-2 py-1 rounded">実践</span>

                    </div>

                  </div>

                </div>

              </div>



              <div className="flex gap-4">

                <div className="w-12 h-12 bg-[#B08968] text-white rounded-xl flex items-center justify-center font-bold text-xl shrink-0">03</div>

                <div>

                  <h3 className="text-xl font-bold text-stone-800 mb-2">週次リブートループ</h3>

                  <p className="text-stone-600 text-sm leading-relaxed">

                    毎週の振り返りで「なぜできなかったか」ではなく「どうすればできるか」を分析。感情に頼らず、仕組みで行動を修正し続けます。

                  </p>

                </div>

              </div>

            </div>

            

            <div className="relative">

              <div className="absolute inset-0 bg-[#E6CCB2] rounded-[40px] transform rotate-3 opacity-20"></div>

              {/* Method Image: コンパスや地図などの象徴的な画像 */}

              <img 

                src="https://images.unsplash.com/photo-1539667468225-eebb663053e6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 

                alt="進むべき道を示す羅針盤" 

                className="rounded-[40px] shadow-xl relative z-10 w-full object-cover h-[400px]"

              />

            </div>

          </div>

        </div>

      </section>



      {/* Value Hierarchy: 得られる未来 */}

      <section id="future" className="py-24 bg-white border-t border-stone-100">

        <div className="container mx-auto px-6">

          <div className="text-center mb-16">

            <span className="text-[#B08968] font-bold tracking-wider uppercase text-sm">Future Value</span>

            <h2 className="text-3xl md:text-4xl font-bold text-stone-800 mt-2">私たちが提供する「価値の階層」</h2>

          </div>



          <div className="max-w-4xl mx-auto space-y-4">

            {/* Level 3 */}

            <div className="bg-[#B08968] text-white p-8 rounded-t-3xl relative z-30 transform hover:scale-105 transition-transform duration-300 shadow-xl">

              <div className="text-xs font-bold opacity-70 mb-1 tracking-widest uppercase">Level 3: Self-Actualization</div>

              <h3 className="text-2xl font-bold mb-4">自己実現・人生の主導権</h3>

              <p className="text-white/90">

                会社に依存しない生き方の実現。「自分にもできた」という自信が、これからの人生のあらゆる挑戦を支える土台となります。

              </p>

            </div>

            

            {/* Level 2 */}

            <div className="bg-[#DDB892] text-white p-8 relative z-20 mx-4 shadow-lg">

              <div className="text-xs font-bold opacity-70 mb-1 tracking-widest uppercase">Level 2: Emotional</div>

              <h3 className="text-xl font-bold mb-2">情緒的価値</h3>

              <p className="text-white/90 text-sm">

                将来への漠然とした不安からの解放。成長実感と達成感を感じられる日々。

              </p>

            </div>



            {/* Level 1 */}

            <div className="bg-[#E6CCB2] text-stone-800 p-8 rounded-b-3xl relative z-10 mx-8 shadow-md">

              <div className="text-xs font-bold opacity-70 mb-1 tracking-widest uppercase">Level 1: Functional</div>

              <h3 className="text-lg font-bold mb-2">機能的価値</h3>

              <p className="text-stone-700 text-sm">

                90日で副業収益を実現するためのロードマップ、実践的なスキル、ツールの獲得。

              </p>

            </div>

          </div>

        </div>

      </section>



      {/* Target Genres */}

      <section className="py-24 bg-[#FAF9F6]">

        <div className="container mx-auto px-6">

          <div className="text-center max-w-2xl mx-auto mb-16">

            <h2 className="text-3xl font-bold text-stone-800">サポート対象となる副業ジャンル</h2>

            <p className="text-stone-600 mt-4">

              あなたの適性と興味に合わせて、初心者でも成果が出しやすい4つの領域から選択できます。

            </p>

          </div>



          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">

            {[

              { icon: <Sparkles size={32} />, title: "AI活用", desc: "ChatGPT等を活用した時短コンテンツ制作や業務効率化。専門知識ゼロから最先端スキルへ。" },

              { icon: <ShoppingBag size={32} />, title: "物販", desc: "再現性の高いネットショップやフリマアプリでの販売。商売の基本を一気通貫で習得。" },

              { icon: <Smartphone size={32} />, title: "SNS運用", desc: "Instagram, X等のアカウント運用。スマホ1台で、あなたの「好き」を資産に変える。" },

              { icon: <Shirt size={32} />, title: "古着転売・輸入", desc: "目利きスキルや独自商品開発。専門家による実践的サポートで差別化を図る。" }

            ].map((genre, idx) => (

              <div key={idx} className="bg-white p-8 rounded-3xl shadow-sm text-center hover:shadow-lg transition-all hover:-translate-y-1 h-full flex flex-col items-center">

                <div className="w-16 h-16 bg-[#FFF8F0] text-[#B08968] rounded-full flex items-center justify-center mb-6 shrink-0">

                  {genre.icon}

                </div>

                <h3 className="text-lg font-bold text-stone-800 mb-3">{genre.title}</h3>

                <p className="text-sm text-stone-600 leading-relaxed flex-grow text-left">

                  {genre.desc}

                </p>

              </div>

            ))}

          </div>

        </div>

      </section>



      {/* Vision / Message Section (Replaces specific founder info) */}

      <section className="py-24 bg-white relative overflow-hidden">

        <div className="container mx-auto px-6 relative z-10">

          <div className="max-w-4xl mx-auto bg-[#FAF9F6] rounded-[40px] p-8 md:p-12 flex flex-col md:flex-row gap-12 items-center">

            <div className="md:w-1/3 flex justify-center">

              <div className="w-48 h-48 bg-stone-200 rounded-full overflow-hidden border-4 border-white shadow-lg flex items-center justify-center bg-gradient-to-br from-[#E6CCB2] to-[#DDB892]">

                 <Flag size={64} className="text-white" />

              </div>

            </div>

            <div className="md:w-2/3">

              <span className="text-[#B08968] font-bold tracking-wider uppercase text-sm mb-2 block">Our Vision</span>

              <h3 className="text-2xl font-bold text-stone-800 mb-6 relative inline-block">

                誰もが「小さな成功」を積み重ねられる世界へ

                <span className="absolute bottom-0 left-0 w-full h-2 bg-[#E6CCB2] opacity-30 -z-10"></span>

              </h3>

              <p className="text-stone-600 leading-relaxed mb-4">

                「やりたい気持ちはあるのに、どうしても続かない」<br/>

                多くの人が直面するこの課題は、個人の意志の弱さではありません。私たちは、それが「仕組み」と「環境」の問題であると考えています。

              </p>

              <p className="text-stone-600 leading-relaxed">

                必要なのは、あなたの特性に合った「地図」と、隣で支えてくれる「相棒」です。<br/>

                buddybowは、あなたの孤独な挑戦を終わらせ、行動できる自分への変革を全力でサポートします。

              </p>

            </div>

          </div>

        </div>

      </section>



      {/* FAQ Section */}

      <section className="py-24 bg-[#FAF9F6]">

        <div className="container mx-auto px-6 max-w-3xl">

          <div className="text-center mb-16">

            <h2 className="text-3xl font-bold text-stone-800">よくあるご質問</h2>

          </div>

          <div className="space-y-4">

            {[

              { q: "副業の経験が全くありませんが大丈夫ですか？", a: "はい、全く問題ありません。むしろ変な癖がついていない初心者の方の方が、素直に吸収し成果が出やすい傾向にあります。あなたのレベルに合わせたロードマップを作成します。" },

              { q: "本業が忙しく、時間が取れるか不安です。", a: "1日30分〜1時間からでも始められるプランを設計します。「隙間時間の活用法」や「生活リズムの見直し」から一緒に考えましょう。" },

              { q: "無料相談では何をしますか？売り込みはされませんか？", a: "あなたの現状のヒアリング、行動タイプ診断の簡易版、そしてロードマップの提案を行います。強引な勧誘は一切行いませんので、安心してお話しください。" },

              { q: "パソコンスキルに自信がありません。", a: "スマホだけで完結できるジャンル（SNS運用など）もご用意しています。また、ツールの使い方も画面共有しながら丁寧にサポートします。" }

            ].map((faq, idx) => (

              <div key={idx} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-100">

                <button 

                  className="w-full px-6 py-5 text-left flex justify-between items-center font-bold text-stone-800 hover:bg-stone-50 transition-colors"

                  onClick={() => toggleFaq(idx)}

                >

                  <span className="flex items-center gap-3">

                    <HelpCircle size={20} className="text-[#B08968]" />

                    {faq.q}

                  </span>

                  <ChevronDown size={20} className={`transform transition-transform ${openFaqIndex === idx ? 'rotate-180' : ''}`} />

                </button>

                {openFaqIndex === idx && (

                  <div className="px-6 py-5 bg-[#FAF9F6] text-stone-600 leading-relaxed text-sm border-t border-stone-100 animate-fade-in">

                    {faq.a}

                  </div>

                )}

              </div>

            ))}

          </div>

        </div>

      </section>



      {/* CTA Section: 無料相談の詳細 */}

      <section id="contact" className="py-24 bg-white">

        <div className="container mx-auto px-6">

          <div className="max-w-4xl mx-auto bg-[#FFF8F0] border-2 border-[#E6CCB2] rounded-[40px] p-8 md:p-16 text-center relative overflow-hidden shadow-xl">

            <div className="absolute top-0 right-0 w-32 h-32 bg-[#B08968] opacity-10 rounded-bl-full"></div>

            

            <h2 className="text-3xl md:text-5xl font-bold text-stone-800 mb-6">

              まずは「無料リブート診断」へ

            </h2>

            <p className="text-lg text-stone-600 mb-8 max-w-2xl mx-auto leading-relaxed">

              90日後、あなたはどうなっていたいですか？<br/>

              その未来への最短ルートを、一緒に描きましょう。

            </p>



            <div className="bg-white rounded-2xl p-6 mb-8 max-w-lg mx-auto shadow-sm text-left">

              <h3 className="font-bold text-stone-800 mb-4 text-center border-b border-stone-100 pb-2">無料相談で得られるもの</h3>

              <ul className="space-y-3">

                <li className="flex items-start gap-2 text-sm text-stone-600">

                  <CheckCircle2 size={18} className="text-[#B08968] shrink-0 mt-0.5" />

                  <span>現状の「行動ブレーキ」の特定</span>

                </li>

                <li className="flex items-start gap-2 text-sm text-stone-600">

                  <CheckCircle2 size={18} className="text-[#B08968] shrink-0 mt-0.5" />

                  <span>あなたに合った副業ジャンルの提案</span>

                </li>

                <li className="flex items-start gap-2 text-sm text-stone-600">

                  <CheckCircle2 size={18} className="text-[#B08968] shrink-0 mt-0.5" />

                  <span>90日間のリブートロードマップ案</span>

                </li>

              </ul>

            </div>

            

            <button className="px-10 py-5 bg-[#B08968] text-white rounded-full font-bold text-xl hover:bg-[#9c7858] transition-all transform hover:scale-105 shadow-xl flex items-center justify-center gap-3 mx-auto w-full md:w-auto animate-pulse">

              <Calendar />

              無料で相談枠を予約する

            </button>

            <p className="text-xs text-stone-500 mt-6">

              ※現在、申し込みが増加しており、毎月各地域5名様限定とさせていただいております。

            </p>

          </div>

        </div>

      </section>



      {/* Footer */}

      <footer className="bg-white py-12 border-t border-stone-100">

        <div className="container mx-auto px-6">

          <div className="flex flex-col md:flex-row justify-between items-center gap-8">

            <div className="text-center md:text-left">

              <span className="text-2xl font-bold tracking-tight text-[#B08968]">buddybow</span>

              <p className="text-xs text-stone-500 mt-2">伴走型リブートプログラム</p>

            </div>

            

            <div className="text-xs text-stone-500 text-center md:text-right space-y-1">

              <p className="font-bold text-stone-700">運営: 株式会社aims</p>

              <p>〒465-0051 愛知県名古屋市名東区社が丘3-1722 乃木坂2F</p>

              <p>info@aims-ngy.com</p>

            </div>

          </div>

          <div className="mt-12 pt-8 border-t border-stone-100 text-center text-xs text-stone-400">

            &copy; {new Date().getFullYear()} buddybow. All rights reserved.

          </div>

        </div>

      </footer>

      

      <style>{`

        @keyframes fade-in-up {

          from { opacity: 0; transform: translateY(20px); }

          to { opacity: 1; transform: translateY(0); }

        }

        @keyframes fade-in {

          from { opacity: 0; }

          to { opacity: 1; }

        }

        @keyframes bounce-slow {

          0%, 100% { transform: translateY(0); }

          50% { transform: translateY(-10px); }

        }

        .animate-fade-in-up {

          animation: fade-in-up 1s ease-out forwards;

        }

        .animate-fade-in {

          animation: fade-in 1s ease-out forwards;

          animation-delay: 0.5s;

          opacity: 0;

        }

        .animate-bounce-slow {

          animation: bounce-slow 3s infinite ease-in-out;

        }

      `}</style>

    </div>

  );

};



export default BuddyBowLP;

