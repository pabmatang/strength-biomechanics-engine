import React, { useState } from 'react';
import { Users, Flame, MessageSquare, Copy, Trophy, Clock, Dumbbell, Send, Check, Heart, UserPlus, Share2, Eye } from 'lucide-react';
import { SocialPost, Routine } from '../types/workout';
import { ViewSocialRoutineModal } from './ViewSocialRoutineModal';

interface SocialFeedScreenProps {
  posts: SocialPost[];
  onToggleKudos: (postId: string) => void;
  onAddComment: (postId: string, commentText: string) => void;
  onCloneRoutine: (routine: Routine) => void;
  onStartRoutine?: (routine: Routine) => void;
}

export const SocialFeedScreen: React.FC<SocialFeedScreenProps> = ({
  posts,
  onToggleKudos,
  onAddComment,
  onCloneRoutine,
  onStartRoutine
}) => {
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [commentInput, setCommentInput] = useState('');
  const [clonedSuccessId, setClonedSuccessId] = useState<string | null>(null);
  const [selectedRoutinePost, setSelectedRoutinePost] = useState<SocialPost | null>(null);

  const handleSubmitComment = (postId: string) => {
    if (!commentInput.trim()) return;
    onAddComment(postId, commentInput.trim());
    setCommentInput('');
  };

  const handleCopyRoutine = (post: SocialPost) => {
    if (post.routine_blueprint) {
      onCloneRoutine(post.routine_blueprint);
      setClonedSuccessId(post.id);
      setTimeout(() => setClonedSuccessId(null), 3000);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300 pb-12 max-w-2xl mx-auto">
      
      {/* Header Banner */}
      <div className="bg-[#12141e] border border-slate-800 rounded-3xl p-5 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Comunidad & Amigos</h2>
            <p className="text-xs text-slate-400">Descubre entrenamientos, copia rutinas y comparte feedback</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>4 amigos activos</span>
        </div>
      </div>

      {clonedSuccessId && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs text-emerald-400 flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 flex-shrink-0" />
          <span>¡Rutina copiada con éxito a tu pestaña de "Mis Rutinas"! Ya puedes entrenarla cuando quieras.</span>
        </div>
      )}

      {/* Posts Feed */}
      <div className="space-y-4">
        {posts.map((post) => (
          <div
            key={post.id}
            className="bg-[#12141e] border border-slate-800/80 rounded-3xl p-5 shadow-xl space-y-4 text-white hover:border-slate-700/80 transition"
          >
            {/* User Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={post.user_avatar}
                  alt={post.user_name}
                  className="w-10 h-10 rounded-2xl object-cover border border-slate-700"
                />
                <div>
                  <div className="font-bold text-sm text-slate-100">{post.user_name}</div>
                  <div className="text-[11px] text-slate-400">{post.user_handle} · {post.time_ago}</div>
                </div>
              </div>

              {post.routine_blueprint && (
                <button
                  onClick={() => handleCopyRoutine(post)}
                  className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-blue-500/30"
                  title="Guardar esta rutina en tu cuenta"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar Rutina</span>
                </button>
              )}
            </div>

            {/* Workout Details Card (Clickable to view full routine details) */}
            <div
              onClick={() => setSelectedRoutinePost(post)}
              className="p-4 bg-[#181a28] rounded-2xl border border-slate-800/90 space-y-3 cursor-pointer hover:border-blue-500/50 hover:bg-[#1a1d2e] transition group"
              title="Click para ver la rutina completa con series, pesos y repeticiones"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-base text-white group-hover:text-blue-400 transition">{post.workout_title}</h3>
                    <span className="text-[10px] text-blue-400 opacity-0 group-hover:opacity-100 transition flex items-center gap-1 font-semibold">
                      <Eye className="w-3 h-3" />
                      <span>Ver rutina</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-blue-400" />
                      {post.duration_minutes} min
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1 font-mono">
                      <Dumbbell className="w-3.5 h-3.5 text-emerald-400" />
                      {post.volume_kg.toLocaleString()} kg
                    </span>
                    <span>·</span>
                    <span>{post.exercises_count} ejercicios</span>
                  </div>
                </div>

                {post.prs_count > 0 && (
                  <div className="px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold flex items-center gap-1.5">
                    <Trophy className="w-3.5 h-3.5" />
                    <span>{post.prs_count} PR</span>
                  </div>
                )}
              </div>

              {/* Exercises Performed Tags */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {post.top_exercises.map((ex, i) => (
                  <span
                    key={i}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800/90 text-slate-300 font-medium group-hover:bg-slate-800 transition"
                  >
                    {ex}
                  </span>
                ))}
              </div>
            </div>

            {/* Social Interactions Bar */}
            <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => onToggleKudos(post.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition active:scale-90 ${
                    post.has_kudos
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 shadow-md shadow-rose-500/10'
                      : 'bg-slate-800/60 text-slate-400 hover:text-white'
                  }`}
                >
                  <Flame className={`w-4 h-4 ${post.has_kudos ? 'fill-current text-rose-500' : ''}`} />
                  <span>{post.kudos_count} Fuegos</span>
                </button>

                <button
                  onClick={() => setActiveCommentPostId(activeCommentPostId === post.id ? null : post.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold bg-slate-800/60 text-slate-400 hover:text-white transition"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>{post.comments.length} Comentarios</span>
                </button>
              </div>

              <button
                onClick={() => handleCopyRoutine(post)}
                className="text-slate-400 hover:text-blue-400 transition flex items-center gap-1 text-[11px] font-medium"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Compartir</span>
              </button>
            </div>

            {/* Comments Expandable Section */}
            {activeCommentPostId === post.id && (
              <div className="space-y-3 pt-2 border-t border-slate-800/80 animate-in fade-in">
                {post.comments.length > 0 && (
                  <div className="space-y-2">
                    {post.comments.map((c) => (
                      <div key={c.id} className="p-2.5 bg-[#181a28] rounded-xl text-xs space-y-0.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-200">{c.user}</span>
                          <span className="text-[10px] text-slate-500">{c.time}</span>
                        </div>
                        <p className="text-slate-300">{c.text}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Comment Input */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Escribe un comentario o pregunta sobre la máquina..."
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmitComment(post.id)}
                    className="flex-1 bg-[#181a28] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={() => handleSubmitComment(post.id)}
                    disabled={!commentInput.trim()}
                    className="p-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 rounded-xl text-white transition"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

          </div>
        ))}
      </div>

      {/* Routine Inspection Modal */}
      {selectedRoutinePost && (
        <ViewSocialRoutineModal
          post={selectedRoutinePost}
          isOpen={true}
          onClose={() => setSelectedRoutinePost(null)}
          onCloneRoutine={onCloneRoutine}
          onStartRoutine={(routine) => {
            setSelectedRoutinePost(null);
            if (onStartRoutine) {
              onStartRoutine(routine);
            }
          }}
        />
      )}

    </div>
  );
};
