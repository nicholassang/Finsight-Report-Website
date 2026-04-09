const variantData = {
    v0: {
        tag: "V0",
        title: "LLM-only baseline",
        summary: "No retrieval. The model answers from parametric memory, which makes it fluent but weakly grounded.",
        pipeline: "Generate only",
        use: "Establish the hallucination floor.",
        strength: "Fast and simple baseline for comparison.",
        tradeoff: "No evidence retrieval, low faithfulness, and no citation grounding."
    },
    v1: {
        tag: "V1",
        title: "Dense retrieval baseline",
        summary: "Embeddings retrieve semantically similar chunks before generation. This is the first grounded version of the system.",
        pipeline: "Dense retrieval -> Generate",
        use: "Strong baseline for factual lookups.",
        strength: "Fastest grounded pipeline and near-optimal for simple factual QA.",
        tradeoff: "Coverage is limited on temporal, comparative, and multi-hop questions."
    },
    v2: {
        tag: "V2",
        title: "Dense retrieval with reranking",
        summary: "A cross-encoder reranker improves the ordering of evidence after dense retrieval.",
        pipeline: "Dense retrieval -> Rerank -> Generate",
        use: "Best choice when groundedness matters most.",
        strength: "Highest faithfulness at 0.843 and strongest evidence precision.",
        tradeoff: "Improves grounding more than answer completeness."
    },
    v3: {
        tag: "V3",
        title: "Hybrid retrieval with RRF",
        summary: "BM25 and dense retrieval are fused, then reranked, which broadens evidence coverage.",
        pipeline: "BM25 + Dense -> RRF -> Rerank -> Generate",
        use: "Good default for figure-heavy and mixed lexical-semantic queries.",
        strength: "Best numerical accuracy at 0.600 and stronger coverage than dense-only pipelines.",
        tradeoff: "More latency and more noise than precision-focused pipelines."
    },
    v4: {
        tag: "V4",
        title: "Query rewriting before hybrid retrieval",
        summary: "The query is rewritten first so the retriever sees a clearer and more specific search target.",
        pipeline: "Query rewrite -> Hybrid retrieval -> RRF -> Rerank -> Generate",
        use: "Best for ambiguous, underspecified, or comparison-heavy questions.",
        strength: "Highest answer relevancy at 0.784 and strong performance on complex tasks.",
        tradeoff: "Coverage improves, but grounding can weaken slightly due to broader retrieval."
    },
    v5: {
        tag: "V5",
        title: "Metadata-filtered dense retrieval",
        summary: "Retrieval is narrowed by fiscal period or document type before dense search begins.",
        pipeline: "Metadata filter -> Dense retrieval -> Generate",
        use: "Structured temporal and document-specific questions.",
        strength: "High faithfulness with near-baseline latency.",
        tradeoff: "Over-filtering can remove useful context for richer comparisons."
    },
    v6: {
        tag: "V6",
        title: "Hybrid retrieval with compression",
        summary: "After broad retrieval and reranking, context is compressed to reduce noise before generation.",
        pipeline: "Hybrid retrieval -> RRF -> Rerank -> Compress -> Generate",
        use: "Complex questions that need broader evidence but tighter final context.",
        strength: "Strong relevancy and numerical performance on harder tasks.",
        tradeoff: "Slowest pipeline at 10.52 seconds average latency."
    }
};

const metricData = {
    faithfulness: {
        label: "Faithfulness",
        title: "Grounded answers peak with reranking.",
        caption: "Higher is better. Faithfulness measures whether answer claims are supported by retrieved evidence.",
        max: 1,
        formatter: (value) => value.toFixed(3),
        values: [
            ["V0", 0.098],
            ["V1", 0.738],
            ["V2", 0.843],
            ["V3", 0.786],
            ["V4", 0.760],
            ["V5", 0.804],
            ["V6", 0.700]
        ]
    },
    relevancy: {
        label: "Answer Relevancy",
        title: "Coverage improves most with query rewriting and hybrid retrieval.",
        caption: "Higher is better. Relevancy measures whether the response fully answers the user question.",
        max: 1,
        formatter: (value) => value.toFixed(3),
        values: [
            ["V0", 0.360],
            ["V1", 0.483],
            ["V2", 0.478],
            ["V3", 0.711],
            ["V4", 0.784],
            ["V5", 0.483],
            ["V6", 0.738]
        ]
    },
    numerical: {
        label: "Numerical Accuracy",
        title: "Hybrid retrieval helps the system recover exact figures.",
        caption: "Higher is better. This custom metric checks whether answers include ground-truth financial numbers.",
        max: 1,
        formatter: (value) => value.toFixed(3),
        values: [
            ["V0", 0.250],
            ["V1", 0.350],
            ["V2", 0.450],
            ["V3", 0.600],
            ["V4", 0.500],
            ["V5", 0.300],
            ["V6", 0.550]
        ]
    },
    latency: {
        label: "Average Latency (s)",
        title: "Pipeline complexity increases runtime cost quickly.",
        caption: "Lower is better in practice, but the chart shows raw seconds so longer bars mean slower pipelines.",
        max: 10.52,
        formatter: (value) => `${value.toFixed(2)}s`,
        values: [
            ["V0", 3.94],
            ["V1", 3.46],
            ["V2", 4.50],
            ["V3", 7.71],
            ["V4", 8.51],
            ["V5", 3.63],
            ["V6", 10.52]
        ]
    }
};

function updateVariant(variantKey) {
    const variant = variantData[variantKey];
    if (!variant) {
        return;
    }

    document.getElementById("variantTag").textContent = variant.tag;
    document.getElementById("variantTitle").textContent = variant.title;
    document.getElementById("variantSummary").textContent = variant.summary;
    document.getElementById("variantPipeline").textContent = variant.pipeline;
    document.getElementById("variantUse").textContent = variant.use;
    document.getElementById("variantStrength").textContent = variant.strength;
    document.getElementById("variantTradeoff").textContent = variant.tradeoff;

    document.querySelectorAll(".variant-tab").forEach((button) => {
        const active = button.dataset.variant === variantKey;
        button.classList.toggle("active", active);
        button.setAttribute("aria-selected", active ? "true" : "false");
    });
}

function updateMetric(metricKey) {
    const metric = metricData[metricKey];
    if (!metric) {
        return;
    }

    document.getElementById("metricLabel").textContent = metric.label;
    document.getElementById("metricTitle").textContent = metric.title;
    document.getElementById("metricCaption").textContent = metric.caption;

    const barChart = document.getElementById("barChart");
    barChart.innerHTML = "";

    metric.values.forEach(([label, value]) => {
        const row = document.createElement("div");
        row.className = "bar-row";

        const labelNode = document.createElement("span");
        labelNode.className = "bar-label";
        labelNode.textContent = label;

        const track = document.createElement("div");
        track.className = "bar-track";

        const fill = document.createElement("div");
        fill.className = "bar-fill";
        track.appendChild(fill);

        const valueNode = document.createElement("span");
        valueNode.className = "bar-value";
        valueNode.textContent = metric.formatter(value);

        row.append(labelNode, track, valueNode);
        barChart.appendChild(row);

        requestAnimationFrame(() => {
            fill.style.width = `${(value / metric.max) * 100}%`;
        });
    });

    document.querySelectorAll(".metric-button").forEach((button) => {
        button.classList.toggle("active", button.dataset.metric === metricKey);
    });
}

function installRevealObserver() {
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("visible");
                    observer.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.16 }
    );

    document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));
}

document.querySelectorAll(".variant-tab").forEach((button) => {
    button.addEventListener("click", () => updateVariant(button.dataset.variant));
});

document.querySelectorAll(".metric-button").forEach((button) => {
    button.addEventListener("click", () => updateMetric(button.dataset.metric));
});

installRevealObserver();
updateVariant("v0");
updateMetric("faithfulness");