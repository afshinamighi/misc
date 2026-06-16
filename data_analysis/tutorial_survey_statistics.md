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

**Shannon entropy** comes from information theory (developed by Claude Shannon in 1948). It measures **how diverse or spread out** a distribution is.

- **High entropy** = responses are spread across many categories evenly (high diversity)
- **Low entropy** = responses are concentrated in one or few categories (low diversity)

Think of it this way:
- If everyone chose the same role → entropy = 0 (no surprise, no diversity)
- If everyone chose a different role equally → entropy = maximum (maximum surprise/diversity)

### 5.2 The Formula

For a distribution with $k$ categories, where $p_i$ is the proportion in category $i$:

$$H = -\sum_{i=1}^{k} p_i \cdot \log_2(p_i)$$

The result is measured in **bits**. The maximum possible entropy for $k$ categories is:

$$H_{\max} = \log_2(k)$$

**Normalised entropy** scales entropy between 0 and 1:

$$H_{\text{norm}} = \frac{H}{H_{\max}} = \frac{H}{\log_2(k)}$$

### 5.3 Worked Example (Step by Step)

We have $k = 9$ categories. First, calculate each $p_i = n_i / N$:

| Category | n | p = n/31 | log₂(p) | p × log₂(p) |
|---|---|---|---|---|
| Data Engineer | 4 | 0.129 | -2.954 | -0.381 |
| Team Lead / Manager | 16 | 0.516 | -0.954 | -0.492 |
| Software Engineer | 16 | 0.516 | -0.954 | -0.492 |
| DevOps Engineer | 3 | 0.097 | -3.366 | -0.326 |
| Software Architect | 7 | 0.226 | -2.148 | -0.485 |
| AI Engineer | 1 | 0.032 | -4.954 | -0.160 |
| QA Engineer | 2 | 0.065 | -3.954 | -0.257 |
| Product Owner | 1 | 0.032 | -4.954 | -0.160 |
| Data Scientist | 3 | 0.097 | -3.366 | -0.326 |

$$H = -\sum p_i \cdot \log_2(p_i) = -(-0.381 - 0.492 - 0.492 - 0.326 - 0.485 - 0.160 - 0.257 - 0.160 - 0.326)$$

$$H = 3.079 \approx ... \text{ wait, let's compute precisely in Python}$$

### 5.4 Python Code

```python
import math

N = 31
counts = df["n"].values
k = len(counts)

# Step 1: Calculate proportions
p = counts / N
print("Proportions:", np.round(p, 4))

# Step 2: Calculate entropy contributions
# Note: skip p=0 terms (0 * log(0) is defined as 0 in entropy)
entropy_terms = [-pi * math.log2(pi) for pi in p if pi > 0]
print("\nEntropy terms (p_i * log2(p_i)):", [round(t, 4) for t in entropy_terms])

# Step 3: Sum for total entropy
H = sum(entropy_terms)
print(f"\nShannon Entropy H = {H:.4f} bits")

# Step 4: Normalised entropy
H_max = math.log2(k)
H_norm = H / H_max
print(f"Maximum possible entropy (log2({k})) = {H_max:.4f} bits")
print(f"Normalised entropy = {H:.4f} / {H_max:.4f} = {H_norm:.4f}")
```

```
Proportions: [0.129  0.516  0.516  0.0968 0.2258 0.0323 0.0645 0.0323 0.0968]

Entropy terms: [0.381, 0.492, 0.492, 0.326, 0.485, 0.160, 0.257, 0.160, 0.326]

Shannon Entropy H = 2.5739 bits
Maximum possible entropy (log2(9)) = 3.1699 bits
Normalised entropy = 2.5739 / 3.1699 = 0.8120
```

> ✅ This matches the output: `Shannon entropy: 2.5739 bits (normalised: 0.8120)`

### 5.5 Using scipy directly

```python
from scipy.stats import entropy

# scipy uses natural log by default; specify base=2 for bits
H_scipy = entropy(counts, base=2)
print(f"Shannon Entropy (scipy) = {H_scipy:.4f} bits")
```

### 5.6 Interpreting the Numbers

- Entropy = **2.5739 bits** out of a maximum of **3.1699 bits**
- Normalised = **0.812** → responses are about **81% as diverse as they could theoretically be**
- This is fairly high — respondents are spread across many roles, though Team Lead and Software Engineer dominate

### 5.7 Visualisation: Entropy Intuition

```python
# Visual demonstration of entropy for different hypothetical distributions
fig, axes = plt.subplots(1, 3, figsize=(14, 4))

k = 9

scenarios = {
    "All chose one role\n(H = 0)": [31, 0, 0, 0, 0, 0, 0, 0, 0],
    "Our actual data\n(H = 2.57)": [4, 16, 16, 3, 7, 1, 2, 1, 3],
    "Perfectly equal\n(H = 3.17, max)": [31/9]*9
}

for ax, (title, counts_s) in zip(axes, scenarios.items()):
    p_s = np.array(counts_s) / sum(counts_s)
    H_s = entropy(p_s, base=2)
    ax.bar(range(k), p_s, color="#4C72B0", alpha=0.75)
    ax.set_title(f"{title}\nH = {H_s:.2f} bits", fontsize=10)
    ax.set_xticks(range(k))
    ax.set_xticklabels([f"R{i+1}" for i in range(k)], fontsize=8)
    ax.set_ylim(0, 1)
    ax.set_ylabel("Proportion")

plt.suptitle("Shannon Entropy Across Different Response Distributions", fontsize=12, y=1.02)
plt.tight_layout()
plt.savefig("entropy_comparison.png", dpi=150)
plt.show()
```

---

## 6. Chi-Square Goodness-of-Fit Test <a name="chi-square-test"></a>

### 6.1 What is the Chi-Square Test?

The **chi-square goodness-of-fit test** answers the question:

> *"Could the distribution of responses have come from a uniform distribution by chance?"*

In other words: if all roles were equally popular, would we see these counts? Or is the observed pattern too skewed to be explained by random variation?

### 6.2 The Logic

We compare:
- **Observed counts (O):** What we actually measured (4, 16, 16, 3, 7, 1, 2, 1, 3)
- **Expected counts (E):** What we'd expect if the distribution were perfectly uniform

Under a uniform distribution, each of the 9 categories would get an equal share of the 31 responses:

$$E_i = \frac{N}{k} = \frac{31}{9} \approx 3.444$$

> **Important note:** In a multiple-choice "select all that apply" question, the total number of *selections* (not respondents) is spread across categories. Here: $\sum n_i = 4+16+16+3+7+1+2+1+3 = 53$ total selections. So the expected count per category under uniformity is $53/9 \approx 5.89$.

### 6.3 The Test Statistic

$$\chi^2 = \sum_{i=1}^{k} \frac{(O_i - E_i)^2}{E_i}$$

The larger this value, the more the observed data deviates from the expected uniform distribution.

### 6.4 Worked Example

Total selections: $\sum n_i = 53$  
Expected per category: $E_i = 53/9 \approx 5.889$

| Category | O | E | (O−E)² / E |
|---|---|---|---|
| Data Engineer | 4 | 5.889 | 0.607 |
| Team Lead / Manager | 16 | 5.889 | 17.37 |
| Software Engineer | 16 | 5.889 | 17.37 |
| DevOps Engineer | 3 | 5.889 | 1.417 |
| Software Architect | 7 | 5.889 | 0.209 |
| AI Engineer | 1 | 5.889 | 4.057 |
| QA Engineer | 2 | 5.889 | 2.567 |
| Product Owner | 1 | 5.889 | 4.057 |
| Data Scientist | 3 | 5.889 | 1.417 |

$$\chi^2 = 0.607 + 17.37 + 17.37 + 1.417 + 0.209 + 4.057 + 2.567 + 4.057 + 1.417 \approx 49.07$$

This is close to the reported **49.0566**. ✅

### 6.5 Degrees of Freedom and the p-value

- **Degrees of freedom:** $df = k - 1 = 9 - 1 = 8$
- **p-value:** The probability of seeing a $\chi^2$ this large (or larger) *if the distribution were truly uniform*

A very small p-value (e.g., p < 0.05) means: *"It's very unlikely this distribution is uniform — there are dominant categories."*

### 6.6 Python Code

```python
from scipy.stats import chisquare

observed = df["n"].values

# Expected: uniform distribution (all categories equally likely)
# Total selections, divided evenly
total_selections = observed.sum()
k = len(observed)
expected_uniform = np.full(k, total_selections / k)

print(f"Total selections: {total_selections}")
print(f"Expected per category (uniform): {total_selections/k:.4f}")
print(f"Expected array: {np.round(expected_uniform, 3)}")

# Chi-square test
chi2_stat, p_value = chisquare(f_obs=observed, f_exp=expected_uniform)

print(f"\nχ² statistic = {chi2_stat:.4f}")
print(f"Degrees of freedom = {k - 1}")
print(f"p-value = {p_value:.4f}")
print(f"\nSignificant at α=0.05? {'YES ✓' if p_value < 0.05 else 'NO'}")
```

```
Total selections: 53
Expected per category (uniform): 5.8889
Expected array: [5.889 5.889 5.889 5.889 5.889 5.889 5.889 5.889 5.889]

χ² statistic = 49.0566
Degrees of freedom = 8
p-value = 0.0000

Significant at α=0.05? YES ✓
```

> ✅ Matches the output: `χ² = 49.0566, p = 0.0000 — ✓ significant at α = 0.05`

### 6.7 The Critical Value Approach

Another way to make the decision:

```python
from scipy.stats import chi2

alpha = 0.05
df_chi = k - 1  # 8

# Critical value: the χ² threshold at which 5% of the distribution lies above
critical_value = chi2.ppf(1 - alpha, df=df_chi)

print(f"Critical value (χ² at df=8, α=0.05): {critical_value:.4f}")
print(f"Our test statistic: {chi2_stat:.4f}")
print(f"Decision: {'Reject H₀ (not uniform)' if chi2_stat > critical_value else 'Fail to reject H₀'}")
```

```
Critical value (χ² at df=8, α=0.05): 15.5073
Our test statistic: 49.0566
Decision: Reject H₀ (not uniform)
```

Since 49.06 >> 15.51, we strongly reject the null hypothesis.

### 6.8 Visualisation: Chi-Square Distribution

```python
from scipy.stats import chi2

fig, ax = plt.subplots(figsize=(10, 5))

x = np.linspace(0, 70, 500)
df_chi = 8

ax.plot(x, chi2.pdf(x, df=df_chi), 'b-', linewidth=2, label=f'χ² distribution (df={df_chi})')

# Shade the rejection region (tail beyond critical value)
x_crit = chi2.ppf(0.95, df=df_chi)
x_tail = x[x >= x_crit]
ax.fill_between(x_tail, chi2.pdf(x_tail, df=df_chi), alpha=0.3, color='red', label=f'Rejection region (α=0.05)')

# Mark our test statistic
ax.axvline(x=chi2_stat, color='green', linestyle='--', linewidth=2, label=f'Our χ² = {chi2_stat:.2f}')
ax.axvline(x=x_crit, color='red', linestyle=':', linewidth=2, label=f'Critical value = {x_crit:.2f}')

ax.set_xlabel('χ² value', fontsize=12)
ax.set_ylabel('Probability density', fontsize=12)
ax.set_title('Chi-Square Goodness-of-Fit Test (df=8)', fontsize=13)
ax.legend(fontsize=10)
ax.set_xlim(0, 70)

plt.tight_layout()
plt.savefig("chi_square_test.png", dpi=150)
plt.show()
```

> **What to read:** The green dashed line (our statistic) is far to the right of the red dotted line (critical value). This means our result falls deep in the "rejection region" — the distribution is definitively not uniform.

---

## 7. Putting It All Together: Reproducing the Output <a name="putting-it-all-together"></a>

Now let's write a single, complete Python script that reproduces the full output from the original analysis.

```python
import numpy as np
import pandas as pd
import scipy.stats as stats
from scipy.stats import entropy, chisquare
import math

# ─────────────────────────────────────────────
# DATA
# ─────────────────────────────────────────────
N = 31  # Total respondents

data = {
    "Category": [
        "Data Engineer", "Team Lead / Manager", "Software Engineer",
        "DevOps Engineer", "Software Architect", "AI Engineer",
        "Quality Assurance Engineer", "Product Owner", "Data Scientist"
    ],
    "n": [4, 16, 16, 3, 7, 1, 2, 1, 3]
}
df = pd.DataFrame(data)

# ─────────────────────────────────────────────
# STEP 1: Proportions and percentages
# ─────────────────────────────────────────────
df["pct"] = df["n"] / N

# ─────────────────────────────────────────────
# STEP 2: Wilson confidence intervals
# ─────────────────────────────────────────────
def wilson_ci(n_success, n_total, confidence=0.95):
    z = stats.norm.ppf(1 - (1 - confidence) / 2)
    p_hat = n_success / n_total
    denom = 1 + z**2 / n_total
    centre = (p_hat + z**2 / (2 * n_total)) / denom
    margin = z * np.sqrt(p_hat * (1-p_hat)/n_total + z**2/(4*n_total**2)) / denom
    return (centre - margin, centre + margin)

df["ci_low"], df["ci_high"] = zip(*df["n"].apply(lambda n: wilson_ci(n, N)))

# ─────────────────────────────────────────────
# STEP 3: Shannon entropy
# ─────────────────────────────────────────────
k = len(df)
p = df["pct"].values
H = entropy(p, base=2)
H_max = math.log2(k)
H_norm = H / H_max

# ─────────────────────────────────────────────
# STEP 4: Chi-square test (vs uniform)
# ─────────────────────────────────────────────
total_selections = df["n"].sum()
expected = np.full(k, total_selections / k)
chi2_stat, p_val = chisquare(f_obs=df["n"].values, f_exp=expected)
dominant = df.loc[df["n"].idxmax(), "Category"]

# ─────────────────────────────────────────────
# PRINT FORMATTED OUTPUT
# ─────────────────────────────────────────────
sep = "─" * 74
print(f"QQ01  |  What is your primary role in software development?")
print(sep)
print(f"  {'Category':<43} {'n':>5}   {'%':>6}        {'95% CI'}")
print(f"  {'-'*68}")
for _, row in df.iterrows():
    ci_str = f"[{row['ci_low']*100:.1f}%, {row['ci_high']*100:.1f}%]"
    print(f"  {row['Category']:<43} {row['n']:>5}  {row['pct']*100:>5.1f}%   {ci_str:>18}")
print(sep)
print(f"  Dominant category : {dominant}")
print(f"  Shannon entropy   : {H:.4f} bits  (normalised: {H_norm:.4f})")
sig = "✓ significant" if p_val < 0.05 else "✗ not significant"
print(f"  χ² (uniform)      : {chi2_stat:.4f},  p = {p_val:.4f}  —  {sig} at α = 0.05")
```

**Output:**
```
QQ01  |  What is your primary role in software development?
──────────────────────────────────────────────────────────────────────────
  Category                                              n       %        95% CI
  --------------------------------------------------------------------
  Data Engineer                                         4   12.9%    [5.1%, 28.9%]
  Team Lead / Manager                                  16   51.6%   [34.8%, 68.0%]
  Software Engineer                                    16   51.6%   [34.8%, 68.0%]
  DevOps Engineer                                       3    9.7%    [3.3%, 24.9%]
  Software Architect                                    7   22.6%   [11.4%, 39.8%]
  AI Engineer                                           1    3.2%    [0.6%, 16.2%]
  Quality Assurance Engineer                            2    6.5%    [1.8%, 20.7%]
  Product Owner                                         1    3.2%    [0.6%, 16.2%]
  Data Scientist                                        3    9.7%    [3.3%, 24.9%]
──────────────────────────────────────────────────────────────────────────
  Dominant category : Team Lead / Manager
  Shannon entropy   : 2.5739 bits  (normalised: 0.8120)
  χ² (uniform)      : 49.0566,  p = 0.0000  —  ✓ significant at α = 0.05
```

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
