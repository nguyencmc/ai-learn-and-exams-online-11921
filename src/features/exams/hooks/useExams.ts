import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Exam, ExamCategory, CreatorProfile, ITEMS_PER_PAGE } from '@/types/exam';

export interface UseExamsReturn {
    // Data
    exams: Exam[];
    categories: ExamCategory[];
    loading: boolean;

    // Filtered/sorted data
    filteredExams: Exam[];
    paginatedExams: Exam[];
    featuredExams: Exam[];
    totalPages: number;

    // Filter state
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    sortBy: string;
    setSortBy: (sort: string) => void;
    selectedCategories: string[];
    selectedDifficulty: string;
    setSelectedDifficulty: (difficulty: string) => void;
    selectedDuration: string[];
    activeCategoryId: string | null;
    viewMode: 'grid' | 'list';
    setViewMode: (mode: 'grid' | 'list') => void;
    savedExams: Set<string>;

    // Pagination
    currentPage: number;
    setCurrentPage: (page: number) => void;

    // Mobile UI
    mobileFilterOpen: boolean;
    setMobileFilterOpen: (open: boolean) => void;
    mobileSearchOpen: boolean;
    setMobileSearchOpen: (open: boolean) => void;

    // Handlers
    handleCategoryToggle: (categoryId: string) => void;
    handleMobileCategorySelect: (categoryId: string | null) => void;
    handleDurationToggle: (duration: string) => void;
    handleReset: () => void;
    toggleSaveExam: (examId: string) => void;

    // Helpers
    getExamCategoryIndex: (exam: Exam) => number;
}

export function useExams(): UseExamsReturn {
    const [categories, setCategories] = useState<ExamCategory[]>([]);
    const [exams, setExams] = useState<Exam[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState("recent");
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedDifficulty, setSelectedDifficulty] = useState<string>("");
    const [selectedDuration, setSelectedDuration] = useState<string[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
    const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
    const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [savedExams, setSavedExams] = useState<Set<string>>(new Set());

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);

        const [categoryResult, examResult, questionSetsResult] = await Promise.all([
            supabase.from("exam_categories").select("id, name, slug").order("name"),
            supabase.from("exams").select("*, exam_categories(id, name, slug)").order("created_at", { ascending: false }),
            supabase.from("question_sets").select("*, exam_categories(id, name, slug)").eq("is_published", true).order("created_at", { ascending: false })
        ]);

        if (categoryResult.data) {
            setCategories(categoryResult.data);
        }

        const allExams: Exam[] = [];
        const allCreatorIds: string[] = [];

        if (examResult.data) {
            examResult.data.forEach(exam => {
                if (exam.creator_id) allCreatorIds.push(exam.creator_id);
            });
        }

        if (questionSetsResult.data) {
            questionSetsResult.data.forEach(qs => {
                if (qs.creator_id) allCreatorIds.push(qs.creator_id);
            });
        }

        const creatorProfiles: Record<string, CreatorProfile> = {};
        const uniqueCreatorIds = [...new Set(allCreatorIds)];

        if (uniqueCreatorIds.length > 0) {
            const { data: profilesData } = await supabase
                .from("profiles")
                .select("user_id, full_name, username, avatar_url")
                .in("user_id", uniqueCreatorIds);

            if (profilesData) {
                profilesData.forEach(profile => {
                    creatorProfiles[profile.user_id] = profile;
                });
            }
        }

        if (examResult.data) {
            examResult.data.forEach(exam => {
                const creator = exam.creator_id ? creatorProfiles[exam.creator_id] : null;
                allExams.push({
                    id: exam.id,
                    title: exam.title,
                    slug: exam.slug,
                    description: exam.description,
                    question_count: exam.question_count,
                    attempt_count: exam.attempt_count,
                    category_id: exam.category_id,
                    difficulty: exam.difficulty,
                    duration_minutes: exam.duration_minutes,
                    thumbnail_url: (exam as Record<string, unknown>).thumbnail_url as string || null,
                    category: exam.exam_categories as ExamCategory | undefined,
                    source: 'exam',
                    creator_id: exam.creator_id,
                    creator_name: creator?.full_name || creator?.username || 'Hệ thống',
                    creator_avatar: creator?.avatar_url || null,
                });
            });
        }

        if (questionSetsResult.data) {
            questionSetsResult.data.forEach(qs => {
                const creator = qs.creator_id ? creatorProfiles[qs.creator_id] : null;
                allExams.push({
                    id: qs.id,
                    title: qs.title,
                    slug: qs.slug || qs.id,
                    description: qs.description,
                    question_count: qs.question_count,
                    attempt_count: 0,
                    category_id: qs.category_id,
                    difficulty: qs.level,
                    duration_minutes: qs.duration_minutes,
                    category: qs.exam_categories as ExamCategory | undefined,
                    source: 'question_set',
                    creator_id: qs.creator_id,
                    creator_name: creator?.full_name || creator?.username || 'Người dùng ẩn danh',
                    creator_avatar: creator?.avatar_url || null,
                });
            });
        }

        setExams(allExams);
        setLoading(false);
    };

    // Filter and sort
    const filteredExams = useMemo(() => {
        let result = [...exams];

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(exam =>
                exam.title.toLowerCase().includes(query) ||
                exam.description?.toLowerCase().includes(query)
            );
        }

        if (activeCategoryId) {
            result = result.filter(exam => exam.category_id === activeCategoryId);
        } else if (selectedCategories.length > 0) {
            result = result.filter(exam =>
                exam.category_id && selectedCategories.includes(exam.category_id)
            );
        }

        if (selectedDifficulty) {
            result = result.filter(exam => exam.difficulty === selectedDifficulty);
        }

        if (selectedDuration.length > 0) {
            result = result.filter(exam => {
                const duration = exam.duration_minutes || 0;
                return selectedDuration.some(range => {
                    if (range === "short") return duration < 30;
                    if (range === "medium") return duration >= 30 && duration <= 90;
                    if (range === "long") return duration > 90;
                    return false;
                });
            });
        }

        if (sortBy === "popular") {
            result.sort((a, b) => (b.attempt_count || 0) - (a.attempt_count || 0));
        } else if (sortBy === "name") {
            result.sort((a, b) => a.title.localeCompare(b.title));
        } else if (sortBy === "questions") {
            result.sort((a, b) => (b.question_count || 0) - (a.question_count || 0));
        }

        return result;
    }, [exams, searchQuery, selectedCategories, activeCategoryId, selectedDifficulty, selectedDuration, sortBy]);

    const totalPages = Math.ceil(filteredExams.length / ITEMS_PER_PAGE);
    const paginatedExams = filteredExams.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const featuredExams = useMemo(() => {
        return [...exams]
            .sort((a, b) => (b.attempt_count || 0) - (a.attempt_count || 0))
            .slice(0, 4);
    }, [exams]);

    // Handlers
    const handleCategoryToggle = (categoryId: string) => {
        setSelectedCategories(prev =>
            prev.includes(categoryId)
                ? prev.filter(id => id !== categoryId)
                : [...prev, categoryId]
        );
        setCurrentPage(1);
    };

    const handleMobileCategorySelect = (categoryId: string | null) => {
        setActiveCategoryId(categoryId);
        setSelectedCategories([]);
        setCurrentPage(1);
    };

    const handleDurationToggle = (duration: string) => {
        setSelectedDuration(prev =>
            prev.includes(duration)
                ? prev.filter(d => d !== duration)
                : [...prev, duration]
        );
        setCurrentPage(1);
    };

    const handleReset = () => {
        setSearchQuery("");
        setSortBy("recent");
        setSelectedCategories([]);
        setSelectedDifficulty("");
        setSelectedDuration([]);
        setActiveCategoryId(null);
        setCurrentPage(1);
    };

    const toggleSaveExam = (examId: string) => {
        setSavedExams(prev => {
            const newSet = new Set(prev);
            if (newSet.has(examId)) {
                newSet.delete(examId);
            } else {
                newSet.add(examId);
            }
            return newSet;
        });
    };

    const getExamCategoryIndex = (exam: Exam) => {
        if (!exam.category_id) return 0;
        const idx = categories.findIndex(c => c.id === exam.category_id);
        return idx >= 0 ? idx : 0;
    };

    return {
        exams,
        categories,
        loading,
        filteredExams,
        paginatedExams,
        featuredExams,
        totalPages,
        searchQuery,
        setSearchQuery,
        sortBy,
        setSortBy,
        selectedCategories,
        selectedDifficulty,
        setSelectedDifficulty,
        selectedDuration,
        activeCategoryId,
        viewMode,
        setViewMode,
        savedExams,
        currentPage,
        setCurrentPage,
        mobileFilterOpen,
        setMobileFilterOpen,
        mobileSearchOpen,
        setMobileSearchOpen,
        handleCategoryToggle,
        handleMobileCategorySelect,
        handleDurationToggle,
        handleReset,
        toggleSaveExam,
        getExamCategoryIndex,
    };
}
