import { useState } from 'react';
import { questions, topics } from './questions.js';

const answerLetters = ['A', 'B', 'C', 'D'];
const savedSessionKey = 'polished-cosmetology-session';

function App() {
	const [view, setView] = useState('home');
	const [selectedTopic, setSelectedTopic] = useState(null);
	const [questionIndex, setQuestionIndex] = useState(0);
	const [selectedAnswer, setSelectedAnswer] = useState(null);
	const [leaveRequest, setLeaveRequest] = useState(null);
	const [saveMessage, setSaveMessage] = useState('');

	const visibleQuestions = selectedTopic
		? questions.filter((question) => question.topic === selectedTopic)
		: questions;
	const currentQuestion = visibleQuestions[questionIndex];
	const answered = selectedAnswer !== null;

	function startStudy(topicId = null) {
		const savedSession = readSavedSession();
		const shouldResume = savedSession?.topicId === topicId
			&& window.confirm('Resume your saved session?');

		setSelectedTopic(topicId);
		setQuestionIndex(shouldResume ? savedSession.questionIndex : 0);
		setSelectedAnswer(shouldResume ? savedSession.selectedAnswer : null);
		setView('study');
	}

	function chooseAnswer(answerIndex) {
		if (!answered) {
			setSelectedAnswer(answerIndex);
		}
	}

	function showNextQuestion() {
		if (questionIndex === visibleQuestions.length - 1) {
			clearSavedSession();
			goHome();
			return;
		}

		setQuestionIndex((index) => index + 1);
		setSelectedAnswer(null);
	}

	function goHome() {
		setView('home');
		setSelectedTopic(null);
		setQuestionIndex(0);
		setSelectedAnswer(null);
	}

	function requestLeave(nextAction) {
		setLeaveRequest(() => nextAction);
	}

	function saveAndLeave() {
		localStorage.setItem(savedSessionKey, JSON.stringify({ topicId: selectedTopic, questionIndex, selectedAnswer }));
		finishLeaveRequest();
	}

	function discardAndLeave() {
		clearSavedSession();
		finishLeaveRequest();
	}

	function finishLeaveRequest() {
		const nextAction = leaveRequest;
		setLeaveRequest(null);
		nextAction?.();
	}

	function saveCurrentProgress() {
		localStorage.setItem(savedSessionKey, JSON.stringify({ topicId: selectedTopic, questionIndex, selectedAnswer }));
		setSaveMessage('Saved');
		window.setTimeout(() => setSaveMessage(''), 1600);
	}

	function readSavedSession() {
		try {
			return JSON.parse(localStorage.getItem(savedSessionKey));
		} catch {
			return null;
		}
	}

	function clearSavedSession() {
		localStorage.removeItem(savedSessionKey);
	}

	if (view === 'study') {
		return (
			<div className="app-shell">
				<Sidebar activeView="study" onNavigate={() => requestLeave(goHome)} onPractice={() => requestLeave(() => startStudy())} />
				<main className="content">
					<Topbar />
					<section className="page-wrap study-page">
						<div className="study-header">
							<div>
								<button className="back-button" onClick={() => requestLeave(goHome)}>← Back to dashboard</button>
								<p className="eyebrow">PRACTICE SESSION</p>
								<h1>{selectedTopic ? getTopicLabel(selectedTopic) : 'Mixed review'}</h1>
							</div>
							<span className="question-number">
								{questionIndex + 1} / {visibleQuestions.length}
							</span>
						</div>

						<QuestionCard
							question={currentQuestion}
							selectedAnswer={selectedAnswer}
							answered={answered}
							onChoose={chooseAnswer}
							onNext={showNextQuestion}
								onSave={saveCurrentProgress}
								saveMessage={saveMessage}
						/>
					</section>
						{leaveRequest && <SaveDialog onSave={saveAndLeave} onDiscard={discardAndLeave} onCancel={() => setLeaveRequest(null)} />}
				</main>
			</div>
		);
	}

	return (
		<div className="app-shell">
			<Sidebar activeView="home" onNavigate={goHome} onPractice={() => startStudy()} />
			<main className="content">
				<Topbar />
				<section className="page-wrap">
					<div className="welcome-row">
						<div>
							<p className="eyebrow">NEBRASKA COSMETOLOGY EXAM</p>
							<h1>Study with <em>intention.</em></h1>
							<p className="intro">Build confidence one focused session at a time.</p>
						</div>
						<div className="progress-ring"><strong>0%</strong><span>COMPLETE</span></div>
					</div>

					<div className="stats-row">
						<div><span>QUESTIONS</span><strong>{questions.length}</strong><small>in this set</small></div>
						<div><span>STREAK</span><strong>0 days</strong><small>start today</small></div>
						<div><span>ACCURACY</span><strong>0%</strong><small>start practicing</small></div>
					</div>

					<div className="section-heading">
						<h2>Choose a topic</h2>
						<button className="text-button" onClick={() => startStudy()}>Mixed review <span>→</span></button>
					</div>
					<div className="topic-grid">
						{topics.map((topic) => (
							<button className="topic-card" key={topic.id} onClick={() => startStudy(topic.id)}>
								<span className={`topic-icon ${topic.color}`}>{topic.icon}</span>
								<span className="topic-title">{topic.label}</span>
								<span className="topic-count">practice <b>{topic.count}</b></span>
							</button>
						))}
					</div>

					<div className="tip-strip">
						<span className="tip-icon">✦</span>
						<div><strong>Small sessions add up.</strong><p>Try ten questions today and return tomorrow.</p></div>
						<button onClick={() => startStudy()}>Start now →</button>
					</div>
				</section>
			</main>
		</div>
	);
}

function Sidebar({ activeView, onNavigate, onPractice }) {
	return (
		<aside className="sidebar">
			<div className="brand"><span className="brand-mark">P</span> Polished</div>
			<p className="brand-note">YOUR STUDY COMPANION</p>
			<nav className="nav-list">
				<button className={`nav-item ${activeView === 'home' ? 'active' : ''}`} onClick={onNavigate}><span>⌂</span> Dashboard</button>
				<button className={`nav-item ${activeView === 'study' ? 'active' : ''}`} onClick={onPractice}><span>▣</span> Practice</button>
			</nav>
			<div className="sidebar-bottom">
				<div className="streak-card"><span className="flame">✦</span><div><strong>0 day streak</strong><small>Start your first session.</small></div></div>
				<p className="source-note">Content is for study practice. Verify current Nebraska rules with DHHS.</p>
			</div>
		</aside>
	);
}

function Topbar() {
	return <header className="topbar"><div className="breadcrumb">POLISHED <span>/</span> STUDY</div><button className="avatar" aria-label="Profile">HS</button></header>;
}

function QuestionCard({ question, selectedAnswer, answered, onChoose, onNext, onSave, saveMessage }) {
	return (
		<article className="question-panel">
			<p className="question-text">{question.prompt}</p>
			<div className="choices">
				{question.choices.map((choice, index) => {
					const isCorrect = answered && index === question.answer;
					const isWrong = answered && index === selectedAnswer && !isCorrect;
					return (
						<button
							className={`choice ${isCorrect ? 'correct' : ''} ${isWrong ? 'wrong' : ''}`}
							key={choice}
							onClick={() => onChoose(index)}
						>
							<span className="choice-letter">{answerLetters[index]}</span>
							<span>{choice}</span>
							{isCorrect && <span className="answer-mark">✓</span>}
						</button>
					);
				})}
			</div>
			{answered && <div className={`explanation ${selectedAnswer === question.answer ? 'good' : ''}`}><strong>{selectedAnswer === question.answer ? 'Correct' : 'Review this one'}</strong><p>{question.explanation}</p></div>}
			<footer className="question-footer"><span>{question.difficulty} question</span><span className="question-actions"><button className="secondary-button" onClick={onSave}>{saveMessage || 'Save progress'}</button>{answered && <button className="primary-button" onClick={onNext}>Next question →</button>}</span></footer>
		</article>
	);
}

function SaveDialog({ onSave, onDiscard, onCancel }) {
	return (
		<div className="dialog-backdrop" role="presentation">
			<div className="save-dialog" role="dialog" aria-modal="true" aria-labelledby="save-title">
				<h2 id="save-title">Save this session?</h2>
				<p>You have not finished this practice set. Save your place so you can continue later?</p>
				<div className="dialog-actions"><button className="secondary-button" onClick={onCancel}>Keep studying</button><button className="secondary-button" onClick={onDiscard}>Discard</button><button className="primary-button" onClick={onSave}>Save and leave</button></div>
			</div>
		</div>
	);
}

function getTopicLabel(topicId) {
	return topics.find((topic) => topic.id === topicId)?.label || 'Mixed review';
}

export default App;
