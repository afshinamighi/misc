# Understanding Survey Statistical Analysis: A Step-by-Step Tutorial

> **Target audience:** Someone with basic statistics knowledge, intermediate math, and intermediate Python programming skills.

---

## Table of Contents

1. [Introduction](#introduction)
2. [The Survey Data We're Working With](#the-survey-data)
3. [Frequency Distributions and Percentages](#frequency-distributions)
4. [Confidence Intervals](#confidence-intervals)
5. [Shannon Entropy](#shannon-entropy)
6. [Chi-Square Goodness-of-Fit Test](#chi-square-test)
7. [Putting It All Together: Reproducing the Output](#putting-it-all-together)
8. [Interpreting the Results](#interpreting-the-results)
9. [Summary Cheat Sheet](#summary-cheat-sheet)

---

## 1. Introduction <a name="introduction"></a>

When we collect survey responses, raw data alone doesn't tell us much. We need to **summarise**, **quantify uncertainty**, **measure diversity**, and **test hypotheses** to extract meaningful insights. This tutorial walks you through each statistical technique used to produce the output you saw, building from the ground up with formulas, worked examples, and runnable Python code.

### What techniques are we covering?

| Technique | Purpose | Where you see it |
|---|---|---|
| Frequency distribution | How often each category appears | `n` and `%` columns |
| 95% Confidence Interval | Uncertainty around each percentage | `95% CI` column |
| Shannon Entropy | How diverse the responses are | `Shannon entropy` row |
| Chi-Square test | Whether distribution differs from uniform | `χ²` row |

<!-- ### Python Libraries Used

```python
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import scipy.stats as stats
from scipy.stats import chi2_contingency, binom
import math
``` -->

<!-- Install any missing libraries with:
```bash
pip install numpy pandas matplotlib scipy
``` -->

---

## 2. The Survey Data We're Working With <a name="the-survey-data"></a>

The question asked participants: *"What is your primary role in software development? (Select all that apply — max 3)"*

This is a **multiple-choice question**: each respondent could select up to 3 roles. There were **31 respondents** in total.

Here's the raw count data:

<!-- ```python
import pandas as pd
import numpy as np

# Raw response counts
data = {
    "Category": [
        "Data Engineer", "Team Lead / Manager", "Software Engineer",
        "DevOps Engineer", "Software Architect", "AI Engineer",
        "Quality Assurance Engineer", "Product Owner", "Data Scientist"
    ],
    "n": [4, 16, 16, 3, 7, 1, 2, 1, 3]
}

df = pd.DataFrame(data)
print(df)
``` -->

```
                     Category   n
0               Data Engineer   4
1         Team Lead / Manager  16
2           Software Engineer  16
3             DevOps Engineer   3
4          Software Architect   7
5                 AI Engineer   1
6  Quality Assurance Engineer   2
7               Product Owner   1
8             Data Scientist    3
```


---

## 3. Frequency Distributions and Percentages <a name="frequency-distributions"></a>

### 3.1 What is a Frequency Distribution?

A **frequency distribution** counts how many times each category appears in your data. For categorical data like survey responses, it's the most fundamental summary.

- **Absolute frequency (n):** Raw count of responses
- **Relative frequency (%):** Count divided by total, expressed as a percentage

### 3.2 The Formula

$$\text{Relative Frequency} = \frac{n_i}{N} \times 100\%$$

Where:
- $n_i$ = count for category $i$
- $N$ = total number of respondents

### 3.3 Worked Example

For "Team Lead / Manager": $n_i = 16$, $N = 31$

$$\frac{16}{31} \times 100\% = 51.6\%$$

<!-- ### 3.4 Python Code

```python
N = 31  # Total respondents

# Calculate percentages
df["pct"] = df["n"] / N * 100

print(df[["Category", "n", "pct"]].to_string(index=False))
``` -->

```
                     Category   n       pct
               Data Engineer    4   12.903
         Team Lead / Manager   16   51.613
           Software Engineer   16   51.613
             DevOps Engineer    3    9.677
          Software Architect    7   22.581
                 AI Engineer    1    3.226
  Quality Assurance Engineer    2    6.452
               Product Owner    1    3.226
              Data Scientist    3    9.677
```


---

## 4. Confidence Intervals <a name="confidence-intervals"></a>

### The core problem

You want to know something about a population — the average, a proportion, whatever. But you cannot measure the whole population, so you take a sample and compute a statistic from it. That statistic is your best guess, but it is not the truth. A different sample would give you a different number. The question a CI answers is: how much should I trust this guess?

### The sampling distribution — the concept everything rests on

Imagine you could repeat your study 10,000 times, each time drawing a fresh random sample of the same size and computing the same statistic (say, the mean). If you plotted all 10,000 results, you would get a distribution — not of your raw data, but of the statistic itself. This is called the sampling distribution.

Two things are always true about it:
- Its centre is (approximately) the true population value.
- Its spread — called the standard error — shrinks as your sample size grows. Larger samples produce estimates that cluster more tightly around the truth.

You never actually run 10,000 studies. But mathematically, you can describe what that sampling distribution would look like, which is what the CI formula captures.

### What a CI actually is

A **confidence interval (CI)** is a procedure that uses your one sample to draw a window around your estimate, sized so that — if you repeated the whole process many times — the window would contain the true population value a stated percentage of the time (95 %, 99 %, etc.).
The critical thing: it is the procedure that has the 95 % success rate, not any single interval. Once you have computed one interval, the true value either is or is not inside it — there is no probability about it anymore. The 95 % refers to the long-run behaviour of the method, not the probability attached to one particular result.

A CI gives a range of plausible values for an unknown
population parameter — most commonly a proportion or a mean — estimated from a
sample. Because we can only observe a subset of the population, our point
estimate (e.g. the sample proportion $\hat{p}$) will differ from the true
population value. A CI acknowledges that uncertainty by providing a lower and
an upper bound.

A 95% CI is an interval that covers 95% of your interest measuring parameters (e.g. the mean). This means if you repeat the experiment for a long time, 95% of times the parameter (e.g. the mean) will be within this interval.



### The most common misconception

Almost everyone, on first encounter, interprets a 95 % CI as: "there is a 95 % probability the true value is in this range." This feels natural but is technically wrong from the frequentist perspective that underlies classical CIs.
The true value is a fixed (unknown) constant — it does not have a probability distribution. What has a 95 % chance of success is the method of constructing the interval. Think of it like a net: a net that catches fish 95 % of the time is a good net, but once you have thrown it, the fish is either caught or it is not.
If you want to say "there is a 95 % probability the true value lies here", you need a Bayesian credible interval instead, which explicitly models your uncertainty about the parameter as a probability distribution.

### What controls the width?

A CI has two ingredients: your point estimate in the centre, and a margin of error on either side. The margin depends on:

#### Sample size n

Larger samples results in narrower interval. The standard error shrinks proportionally to $1/\sqrt{n}$, so to halve the width you need to quadruple the sample size.

#### Variability in the data. 

More spread in the underlying population means wider interval. You are less certain because observations are noisier.

#### Confidence level. 

A 99% CI is wider than a 95% CI. You pay for more confidence with less precision.

These three always trade off against each other. There is no free lunch: you cannot have high confidence, high precision, and a tiny sample at the same time.



**Why it matters in survey analysis.** A raw percentage (e.g. "52 % selected
this option") says nothing about precision. With a sample of n = 31, that same
52% could reasonably represent anything from roughly 34% to 68% of the
population. **A CI makes that uncertainty explicit and prevents over-interpretation
of small samples**.

---

### The General Formula

For a population proportion $p$, the classical point estimate from a sample of
size $n$ is:

$$\hat{p} = \frac{k}{n}$$

where $k$ is the number of "successes" (e.g. respondents who selected a given
option). The **standard error** of $\hat{p}$ is:

$$SE(\hat{p}) = \sqrt{\frac{\hat{p}(1-\hat{p})}{n}}$$

A symmetric confidence interval at confidence level $1 - \alpha$ is then:

$$\hat{p} \pm z_{\alpha/2} \cdot SE(\hat{p})$$

where $z_{\alpha/2}$ is the critical value from the standard normal distribution
(1.96 for 95 %, 2.576 for 99 %).

---

### A Simple Example

Suppose 14 out of 20 students pass an exam ($k = 14$, $n = 20$).

$$\hat{p} = \frac{14}{20} = 0.70$$

$$SE = \sqrt{\frac{0.70 \times 0.30}{20}} = \sqrt{0.0105} \approx 0.1025$$

$$\text{95 \% CI} = 0.70 \pm 1.96 \times 0.1025 = 0.70 \pm 0.201 = [0.499,\ 0.901]$$

**Interpretation.** If we repeat the sampling procedure, i.e. drawing 20 students from the same population and computing a CI each time, new intervals will be calculated but 95% of the resulting intervals would contain the true (fixed) pass rate. We have to emphasize here that we do not repeat the exam, because repeating the exam would change who passes and who fails (pass rate).

---

### Some Techniques

Depending on the context and the parameters of interest, different techniques can be used to calculate confidence intervals (CIs). Here, we introduce three common methods:


| Method | Core idea | Typical context |
|---|---|---|
| **Normal (Wald) approximation** | $\hat{p} \pm z \cdot \sqrt{\hat{p}(1-\hat{p})/n}$ | Large $n$, $\hat{p}$ not near 0 or 1 |
| **Wilson score** | Inverts the score test; centres interval on an adjusted proportion | Small $n$, rare events, multi-choice surveys |
| **Clopper–Pearson (exact)** | Uses Beta distribution quantiles; guaranteed coverage | Medical / clinical trials; regulatory contexts |

**Practical guidance.**

- Use the **Wald** interval as a quick approximation when $n > 100$ and $0.1 < \hat{p} < 0.9$.
- Prefer **Wilson** (or **Agresti–Coull**) for survey proportions with moderate $n$ (< 100) or when some categories may have very few selections.
- Use **Clopper–Pearson** when you need guaranteed (conservative) coverage, e.g. for safety-critical reporting.

---

### Multi-Choice Questions and the Wilson Score Interval

#### The survey question

> *What is your primary role in software development? (Select all that apply — max 3)*

With $n = 31$ respondents, the observed selection counts are:

| Category | $k$ | $\hat{p} = k/n$ |
|---|--:|--:|
| Data Engineer | 4 | 12.9 % |
| Team Lead / Manager | 16 | 51.6 % |
| Software Engineer | 16 | 51.6 % |
| DevOps Engineer | 3 | 9.7 % |
| Software Architect | 7 | 22.6 % |
| AI Engineer | 1 | 3.2 % |
| Quality Assurance Engineer | 2 | 6.5 % |
| Product Owner | 1 | 3.2 % |
| Data Scientist | 3 | 9.7 % |

Each category is treated as an independent binary outcome: a respondent either
selected it ($1$) or did not ($0$). The denominator is always the **total
number of respondents** ($n = 31$), not the total number of selections
($\sum k_i = 53$).


---

#### The Wilson Score Interval

The Wilson interval is derived by inverting the score test. Rather than
computing "how far is $\hat{p}$ from the hypothesised $p_0$?", it asks:
"for which values of $p_0$ would the observed $\hat{p}$ not be surprising?"
This produces an interval that is naturally bounded within $[0, 1]$.

The formula is:

$$\text{lower, upper} =
\frac{\hat{p} + \dfrac{z^2}{2n} \;\pm\; z\sqrt{\dfrac{\hat{p}(1-\hat{p})}{n} + \dfrac{z^2}{4n^2}}}
     {1 + \dfrac{z^2}{n}}$$

where $z = 1.96$ for a 95 % interval.

**Key properties.**

1. **Always in $[0,1]$.** Adding $z^2/(2n)$ to the numerator before dividing shifts the centre away from the boundary, preventing negative bounds.
2. **Asymmetric near the boundaries.** When $\hat{p}$ is close to 0 or 1, the interval deliberately stretches more on the uncertain side — statistically correct behaviour.
3. **Reduces to Wald for large $n$.** As $n \to \infty$, the correction terms $z^2/n \to 0$ and both formulas converge.

---

#### Step-by-step: AI Engineer ($k = 1$, $n = 31$)

This is the most extreme case and best illustrates the difference.

**Step 1 — point estimate**

$$\hat{p} = \frac{1}{31} \approx 0.0323$$

**Step 2 — constants**

$$z = 1.96, \quad z^2 = 3.8416$$

**Step 3 — adjusted centre**

$$\tilde{p} = \frac{0.0323 + \dfrac{3.8416}{2 \times 31}}{1 + \dfrac{3.8416}{31}}
= \frac{0.0323 + 0.0619}{1.1239}
= \frac{0.0942}{1.1239}
\approx 0.0839$$

**Step 4 — margin**

$$M = \frac{1.96}{1.1239}\sqrt{\frac{0.0323 \times 0.9677}{31} + \frac{3.8416}{4 \times 31^2}}
= 1.743 \times \sqrt{0.001008 + 0.001000}
\approx 1.743 \times 0.0448
\approx 0.0781$$

**Step 5 — interval**

$$\text{lower} = 0.0839 - 0.0781 \approx 0.6\%$$
$$\text{upper} = 0.0839 + 0.0781 \approx 16.2\%$$

**Interpretation.** Although only one of 31 respondents identified as an AI
Engineer, the Wilson 95% CI is `[0.6% , 16.2% ]`. We cannot rule out that
up to ~16% of the broader ICT workforce holds this role. This is wide but
honest: it accurately reflects the uncertainty when $k = 1$. The Wald
result (`[-3.0% , 9.5% ]`) is simply invalid.



#### Computing Wilson CIs with `proportion_confint`

The `proportion_confint` function from `statsmodels` computes confidence
intervals for a proportion using several methods, including Wilson.

```python
from statsmodels.stats.proportion import proportion_confint

lower, upper = proportion_confint(count, nobs, alpha=0.05, method='wilson')
```

- `count` — number of successes ($k$)
- `nobs` — total number of observations ($n$)
- `alpha` — significance level; `0.05` → 95 % CI, `0.01` → 99 % CI
- `method` — CI technique; use `'wilson'` for the Wilson score interval

> **Important.** The default method is `'normal'` (Wald). Always specify
> `method='wilson'` explicitly, otherwise you may silently get invalid
> intervals for small samples or rare categories.

**Example** — 14 out of 20 students pass an exam:

```python
lower, upper = proportion_confint(count=14, nobs=20, alpha=0.05, method='wilson')
print(f"95 % Wilson CI: [{lower:.3f}, {upper:.3f}]")
# 95 % Wilson CI: [0.469, 0.871]
```


---

#### Results for all categories (95 % Wilson CI, $n = 31$)

| Category | $k$ | $\hat{p}$ | Wilson lower | Wilson upper | Wald lower |
|---|--:|--:|--:|--:|--:|
| Data Engineer | 4 | 12.9 % | 5.1 % | 28.9 % | 1.1 % |
| Team Lead / Manager | 16 | 51.6 % | 34.8 % | 68.0 % | 34.0 % |
| Software Engineer | 16 | 51.6 % | 34.8 % | 68.0 % | 34.0 % |
| DevOps Engineer | 3 | 9.7 % | 3.3 % | 24.9 % | **−0.7 %** ✗ |
| Software Architect | 7 | 22.6 % | 11.4 % | 39.8 % | 7.9 % |
| AI Engineer | 1 | 3.2 % | 0.6 % | 16.2 % | **−3.0 %** ✗ |
| Quality Assurance Engineer | 2 | 6.5 % | 1.8 % | 20.7 % | **−2.2 %** ✗ |
| Product Owner | 1 | 3.2 % | 0.6 % | 16.2 % | **−3.0 %** ✗ |
| Data Scientist | 3 | 9.7 % | 3.3 % | 24.9 % | **−0.7 %** ✗ |

---

#### A note on independence

The Wilson CI treats each category as an independent binary question.
In a multi-select setting this is an approximation — the choices are not
fully independent (e.g. selecting "Team Lead" may correlate with "Software
Engineer"). Reporting per-category CIs is nonetheless the standard approach
for descriptive survey reporting. If joint distributions are needed, consider
logistic regression or multiple correspondence analysis instead.

---

## 5. Shannon Entropy <a name="shannon-entropy"></a>

### 5.1 What is Shannon Entropy?

**Shannon entropy** comes from information theory (Claude Shannon, 1948). In
the context of survey analysis it measures **how spread out responses are
across categories**.

- **High entropy** → responses are distributed evenly across many categories
- **Low entropy** → responses concentrate in one or few categories

Two extreme cases build the intuition:

- If every respondent chose the same answer → entropy = 0 (no diversity,
  no surprise)
- If respondents were spread perfectly equally across all categories →
  entropy = maximum (complete diversity)

Everything else falls somewhere between these two extremes.

---

### 5.2 The Formula

For a distribution with $k$ categories, where $p_i$ is the proportion of
responses in category $i$:

$$H = -\sum_{i=1}^{k} p_i \cdot \log_2(p_i)$$

The result is measured in **bits**. The maximum possible entropy for $k$
categories is:

$$H_{\max} = \log_2(k)$$

**Normalised entropy** scales the result to $[0, 1]$, making it comparable
across questions with different numbers of categories:

$$H_{\text{norm}} = \frac{H}{H_{\max}} = \frac{H}{\log_2(k)}$$

One requirement is fundamental: **the $p_i$ values must form a valid
probability distribution**, meaning they must be non-negative and sum to
exactly 1. This is automatic for single-choice questions, but requires
extra care for multi-select questions — as we will see below.

---

### 5.3 Worked Example: Single-Choice Question

**Question:** *How many years of experience do you have in software
development?* ($n = 31$ respondents, $k = 5$ categories)

Because each respondent selects exactly one answer, the counts sum to $n$:

$$\sum n_i = 7 + 14 + 4 + 1 + 5 = 31 = n$$

The proportions therefore sum to 1 automatically:

$$p_i = \frac{n_i}{n}, \qquad \sum p_i = 1 \checkmark$$

| Category | $n_i$ | $p_i = n_i/31$ | $\log_2(p_i)$ | $p_i \times \log_2(p_i)$ |
|---|--:|--:|--:|--:|
| 4 – 6 years | 7 | 0.2258 | −2.1468 | −0.4848 |
| > 10 years | 14 | 0.4516 | −1.1468 | −0.5179 |
| 7 – 10 years | 4 | 0.1290 | −2.9542 | −0.3812 |
| < 1 year | 1 | 0.0323 | −4.9542 | −0.1598 |
| 1 – 3 years | 5 | 0.1613 | −2.6323 | −0.4246 |

$$H = -\sum p_i \cdot \log_2(p_i) = -(−0.4848 − 0.5179 − 0.3812 − 0.1598 − 0.4246) = 1.968 \text{ bits}$$

$$H_{\max} = \log_2(5) = 2.322 \text{ bits}$$

$$H_{\text{norm}} = \frac{1.968}{2.322} = 0.848$$

**Interpretation.** The distribution is about 85 % as diverse as it could
theoretically be. The dominant group (> 10 years, 45 %) pulls entropy
downward from its maximum, but the remaining four categories are spread
reasonably well, keeping diversity high.

---

### 5.4 The Problem with Multi-Select Questions

Now consider a multi-select question where respondents could choose up to
3 options:

**Question:** *What is your primary role in software development?*
($n = 31$ respondents, $k = 9$ categories, up to 3 selections each)

The temptation is to compute proportions the same way: $p_i = n_i / 31$.
But this breaks the fundamental requirement of Shannon entropy. In a
multi-select question, each respondent contributes more than one selection,
so the counts no longer sum to $n$:

$$\sum n_i = 4 + 16 + 16 + 3 + 7 + 1 + 2 + 1 + 3 = 53 \neq 31$$

Dividing by 31 therefore gives proportions that sum to $53/31 \approx 1.71$,
not 1:

$$\sum p_i = \frac{53}{31} \approx 1.71 \quad \leftarrow \text{not a valid probability distribution}$$

Feeding values that do not sum to 1 into the Shannon formula produces a
number that has no meaningful interpretation as entropy. You would be
measuring something undefined.

---

### 5.5 The Fix: Shift the Denominator

The solution is conceptually simple: instead of dividing by the number of
**respondents**, divide by the number of **selections**:

$$p_i = \frac{n_i}{\sum n_i} = \frac{n_i}{53}$$

This reframes the question. Rather than asking *"what fraction of respondents
chose category $i$?"*, we ask *"what fraction of all selections went to
category $i$?"* The unit of analysis shifts from the respondent to the
individual selection — and the proportions now sum to 1 by construction.

The entropy then measures: **how evenly are the selections distributed across
categories?**

---

### 5.6 Worked Example: Multi-Select Question (Corrected)

Using $\sum n_i = 53$ as the denominator:

| Category | $n_i$ | $p_i = n_i/53$ | $\log_2(p_i)$ | $p_i \times \log_2(p_i)$ |
|---|--:|--:|--:|--:|
| Data Engineer | 4 | 0.0755 | −3.7279 | −0.2814 |
| Team Lead / Manager | 16 | 0.3019 | −1.7279 | −0.5216 |
| Software Engineer | 16 | 0.3019 | −1.7279 | −0.5216 |
| DevOps Engineer | 3 | 0.0566 | −4.1430 | −0.2345 |
| Software Architect | 7 | 0.1321 | −2.9206 | −0.3857 |
| AI Engineer | 1 | 0.0189 | −5.7279 | −0.1081 |
| QA Engineer | 2 | 0.0377 | −4.7279 | −0.1784 |
| Product Owner | 1 | 0.0189 | −5.7279 | −0.1081 |
| Data Scientist | 3 | 0.0566 | −4.1430 | −0.2345 |

$$H = 2.574 \text{ bits}, \qquad H_{\max} = \log_2(9) = 3.170 \text{ bits}, \qquad H_{\text{norm}} = 0.812$$


#### Python implementation

The natural homes for entropy in Python are:

- `scipy.stats.entropy`: the standard go-to; computes Shannon entropy and also KL divergence between two distributions
- `numpy`: no built-in entropy function, but the formula is one line: `-np.sum(probs * np.log2(probs))`

----

### 5.8 Interpretation

| Question | $H$ (bits) | $H_{\max}$ (bits) | $H_{\text{norm}}$ |
|---|--:|--:|--:|
| Years of experience (single) | 1.968 | 2.322 | 0.848 |
| Primary role (multi-select) | 2.574 | 3.170 | 0.812 |

Both questions show high normalised entropy (above 0.80), meaning responses
are fairly spread across categories in both cases. The dominant groups —
developers with more than 10 years of experience, and Team Lead / Software
Engineer roles — reduce entropy from its theoretical maximum, but not enough
to make the distributions strongly concentrated.

---

### 5.9 What Does Entropy Add Beyond Proportions?

A natural question is: if the proportions already show which category
dominates and how evenly responses are spread, what does entropy actually
add?

The answer is: nothing new for a single question read by a human eye.
Looking at a distribution table, you can already interpret diversity and
dominance qualitatively. Entropy converts that qualitative interpretation
into a single quantitative number. That number becomes useful the moment
you need to go beyond reading one table — comparing diversity across
questions with different numbers of categories, tracking how a distribution
shifts between survey versions, or ranking many questions by their level
of consensus. In short, entropy does not reveal something invisible in the
data; it encodes what you already see into a form that is computable and
comparable.

---------


---

## 6. Chi-Square Goodness of Fit <a name="chi-square-test"></a>

### 6.1 Intuition in a Survey Context

Shannon entropy tells you **how spread out** a distribution is. The
chi-square goodness of fit test asks a different, sharper question: **is
the observed distribution meaningfully different from what you would expect
by chance?**

In a survey context, the most natural reference point is the **uniform
distribution** — the scenario where every category is equally likely, i.e.
respondents are distributed evenly across all options. The test then asks:
is the deviation from that uniform baseline large enough to be statistically
significant, or could it plausibly be explained by random sampling variation?

This distinction matters. Entropy might tell you a distribution is 85 %
diverse, but that number alone does not tell you whether the deviation from
perfect uniformity is meaningful or just noise from a small sample. Chi-square
answers the noise question.

---

### 6.2 The Formula

Given $k$ categories with observed counts $O_i$ and expected counts $E_i$
under the null hypothesis:

$$\chi^2 = \sum_{i=1}^{k} \frac{(O_i - E_i)^2}{E_i}$$

Each term $(O_i - E_i)^2 / E_i$ measures how far one category deviates from
expectation, scaled by the expectation itself. Larger deviations contribute
more. The total $\chi^2$ is the sum of all those contributions.

For a uniform null hypothesis with $n$ total observations:

$$E_i = \frac{n}{k} \quad \text{for all } i$$

The test statistic follows a chi-square distribution with $df = k - 1$
degrees of freedom. A large $\chi^2$ — beyond the critical value for a
chosen significance level — leads to rejecting the null hypothesis.
Equivalently, a small p-value (typically $< 0.05$) indicates the observed
distribution is unlikely to have arisen from the uniform baseline by chance.

> **Rule of thumb.** The chi-square approximation is reliable when all
> expected counts $E_i \geq 5$. Below that threshold the test becomes
> unreliable, especially for categories with very small counts.

---

### 6.3 Worked Example: Single-Choice Question

**Question:** *How many years of experience do you have in software
development?* ($n = 31$, $k = 5$)

Under the uniform null hypothesis, every category is expected to have
$E_i = 31 / 5 = 6.2$ respondents.

| Category | $O_i$ | $E_i$ | $(O_i - E_i)^2 / E_i$ |
|---|--:|--:|--:|
| 4 – 6 years | 7 | 6.2 | 0.103 |
| > 10 years | 14 | 6.2 | 9.813 |
| 7 – 10 years | 4 | 6.2 | 0.781 |
| < 1 year | 1 | 6.2 | 4.361 |
| 1 – 3 years | 5 | 6.2 | 0.232 |

$$\chi^2 = 0.103 + 9.813 + 0.781 + 4.361 + 0.232 = 15.290$$

$$df = k - 1 = 4, \quad \chi^2_{\text{critical}}(\alpha=0.05,\ df=4) = 9.488$$

$$p\text{-value} = 0.004$$

Since $\chi^2 = 15.290 > 9.488$ and $p = 0.004 < 0.05$, we reject the null
hypothesis. The distribution of experience levels is significantly different
from uniform.

Looking at the individual terms, the dominant contributor is the "> 10
years" category with a term of 9.813 — by far the largest. This confirms
what the proportions already suggested: senior developers are
over-represented relative to what a uniform distribution would predict.

---

### 6.4 Multi-Select Question: What Changes?

**Question:** *What is your primary role in software development?*
($n = 31$ respondents, 53 total selections, $k = 9$ categories)

The same conceptual question applies — are selections distributed uniformly
across roles? — but the mechanics need adjustment for the same reason as
entropy: dividing by the number of respondents ($n = 31$) does not produce
a valid reference distribution because respondents contribute multiple
selections.

The fix follows the same logic as before: **use total selections as the
reference**, not total respondents. The expected count per category under
uniform becomes:

$$E_i = \frac{\sum O_i}{k} = \frac{53}{9} \approx 5.889$$

| Category | $O_i$ | $E_i$ | $(O_i - E_i)^2 / E_i$ |
|---|--:|--:|--:|
| Data Engineer | 4 | 5.889 | 0.606 |
| Team Lead / Manager | 16 | 5.889 | 17.361 |
| Software Engineer | 16 | 5.889 | 17.361 |
| DevOps Engineer | 3 | 5.889 | 1.417 |
| Software Architect | 7 | 5.889 | 0.210 |
| AI Engineer | 1 | 5.889 | 4.059 |
| QA Engineer | 2 | 5.889 | 2.568 |
| Product Owner | 1 | 5.889 | 4.059 |
| Data Scientist | 3 | 5.889 | 1.417 |

$$\chi^2 = 49.057, \quad df = 8, \quad \chi^2_{\text{critical}}(\alpha=0.05,\ df=8) = 15.507$$

$$p\text{-value} \approx 0$$

The result is unambiguous: the distribution of role selections is far from
uniform.

**One important caveat.** The standard chi-square goodness of fit test
assumes observations are independent. In a multi-select question, a single
respondent contributes to multiple categories simultaneously, so that
assumption is softened. The test applied here treats individual selections
as the unit of observation rather than respondents. This is a reasonable
practical approximation for descriptive purposes, but the p-value and
critical value should be interpreted with some caution rather than
mechanically.

---

### 6.5 What Does Chi-Square Add to a Survey Interpretation?

The same question raised for entropy applies here: what does chi-square add
beyond reading the proportions?

The answer is more concrete than it was for entropy. Proportions tell you
*what* the distribution looks like. Chi-square tells you whether the pattern
you see is **statistically reliable** or could simply be an artefact of a
small sample. With $n = 31$, a category showing 45 % could look dominant
just by chance. Chi-square quantifies whether that chance explanation is
plausible.

In practice, chi-square is most useful in two situations:

- **Comparing responses across subgroups.** If you split respondents by
  company size or sector, chi-square tests whether the distributions
  differ significantly between groups — not just visually, but in a way
  that is unlikely to be random.
- **Flagging questions worth investigating further.** A low chi-square
  (non-significant) on a question with few categories may indicate genuine
  consensus, or simply insufficient data. A very high chi-square flags
  strong structural patterns that deserve attention in the analysis.

Connecting it back to entropy: entropy quantifies *how much* diversity
exists; chi-square tests *whether* the deviation from uniform is real.
They answer complementary questions and are most useful together.

---

## 8. Interpreting the Results <a name="interpreting-the-results"></a>

Now that you know *how* each number was produced, let's understand *what they mean* together.

### 8.1 Reading the Frequency Table

| Observation | What it means |
|---|---|
| Team Lead / Manager: 51.6% | More than half of respondents identified as managers |
| Software Engineer: 51.6% | Equally common; many respondents hold both roles |
| AI Engineer: 3.2% | Very rare in this sample |
| Wide CIs for rare roles | Small n → high uncertainty; we can't be confident about the true population rate |

### 8.2 Reading the Entropy

- **H = 2.5739 bits** with a normalised score of **0.812**
- Interpretation: The distribution is **81% as diverse as possible** for 9 categories
- This tells us: while Team Lead and Software Engineer dominate, there's still a reasonable spread across roles — this isn't a single-role survey

> **Rule of thumb:** Normalised entropy < 0.5 → very concentrated; 0.5–0.75 → moderate diversity; > 0.75 → high diversity

### 8.3 Reading the Chi-Square Test

- **χ² = 49.06, p ≈ 0.000**
- The probability of seeing this distribution by chance (if roles were equally popular) is essentially **zero**
- Conclusion: **The distribution is statistically significantly non-uniform** — certain roles genuinely dominate in this population

### 8.4 The Full Picture

Together, these statistics paint a coherent picture:

1. The sample is **skewed** (Team Lead and Software Engineer dominate)
2. But it's **not completely concentrated** (entropy is still fairly high — 8 of 9 roles are represented)
3. The non-uniformity is **statistically significant** — this is a real pattern, not random noise
4. Individual estimates have **wide confidence intervals** due to the small sample size (N=31)

---

## 9. Summary Cheat Sheet <a name="summary-cheat-sheet"></a>

### Formula Reference

| Measure | Formula | Python |
|---|---|---|
| Relative frequency | $p_i = n_i / N$ | `df["n"] / N` |
| Wilson CI | See Section 4.3 | `custom wilson_ci()` function |
| Shannon entropy | $H = -\sum p_i \log_2 p_i$ | `scipy.stats.entropy(p, base=2)` |
| Normalised entropy | $H_{norm} = H / \log_2(k)$ | `H / math.log2(k)` |
| Chi-square statistic | $\chi^2 = \sum (O-E)^2/E$ | `scipy.stats.chisquare(obs, exp)` |
| Degrees of freedom | $df = k - 1$ | `k - 1` |

### Decision Rules

| Result | Interpretation |
|---|---|
| Wide CI | Small sample for that category; be cautious |
| $H_{norm}$ close to 1 | Responses spread evenly across categories |
| $H_{norm}$ close to 0 | One category dominates |
| $p < 0.05$ in χ² test | Distribution is significantly non-uniform |
| $p \geq 0.05$ in χ² test | Cannot rule out a uniform distribution |

### When to Use Each Method

- **Frequency distribution:** Always — it's the foundation
- **Wilson CI:** When your sample is small (N < 100) or proportions are near 0% or 100%
- **Shannon entropy:** When you want to summarise *how spread out* responses are in a single number
- **Chi-square test:** When you want to test whether a distribution could be uniform (or any other expected distribution)

---

*Tutorial written to accompany the statistical analysis output of a software development role survey (N=31). All formulas and code are self-contained and reproducible.*
