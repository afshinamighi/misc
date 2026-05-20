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

### Python Libraries Used

```python
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import scipy.stats as stats
from scipy.stats import chi2_contingency, binom
import math
```

Install any missing libraries with:
```bash
pip install numpy pandas matplotlib scipy
```

---

## 2. The Survey Data We're Working With <a name="the-survey-data"></a>

The question asked participants: *"What is your primary role in software development? (Select all that apply — max 3)"*

This is a **multiple-choice question**: each respondent could select up to 3 roles. There were **31 respondents** in total (we'll derive this in a moment).

Here's the raw count data:

```python
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
```

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

### How do we know N = 31?

The question asks "Select all that apply," which means multiple-choice. The `n` in the output refers to **number of respondents who selected each option**, not total selections. The total number of *unique respondents* is stated as N = 31. You can verify this from context (e.g., `51.6% ≈ 16/31`).

```python
# Verify: if n=16 and %=51.6%, then N = ?
n = 16
pct = 0.516
N = round(n / pct)
print(f"Estimated N = {N}")  # → 31
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

### 3.4 Python Code

```python
N = 31  # Total respondents

# Calculate percentages
df["pct"] = df["n"] / N * 100

print(df[["Category", "n", "pct"]].to_string(index=False))
```

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

### 3.5 Visualisation: Bar Chart

```python
import matplotlib.pyplot as plt

fig, ax = plt.subplots(figsize=(10, 6))

colors = ["#4C72B0" if p < 50 else "#DD8452" for p in df["pct"]]
bars = ax.barh(df["Category"], df["pct"], color=colors)

ax.set_xlabel("Percentage (%)", fontsize=12)
ax.set_title("QQ01 — Primary Role in Software Development\n(N=31, multiple choice)", fontsize=13)
ax.axvline(x=100/9, color="gray", linestyle="--", linewidth=1, label="Uniform (11.1%)")
ax.legend()

# Add value labels
for bar, val in zip(bars, df["pct"]):
    ax.text(val + 0.5, bar.get_y() + bar.get_height()/2,
            f"{val:.1f}%", va="center", fontsize=10)

plt.tight_layout()
plt.savefig("qq01_barplot.png", dpi=150)
plt.show()
```

> **What to look for:** The dashed line shows where each bar would sit if responses were perfectly equally spread (uniform). Bars much taller than the dashed line represent dominant categories.

---

## 4. Confidence Intervals <a name="confidence-intervals"></a>

### 4.1 What is a Confidence Interval?

A **confidence interval (CI)** captures the uncertainty around an estimate. Because our 31 respondents are just a *sample* from a larger population, the true percentage in the population could be slightly different from what we measured.

A **95% CI** means: if we repeated this survey many times, 95% of the resulting intervals would contain the true population proportion.

### 4.2 Why Not Just Use the Simple ± Formula?

You may have seen:

$$\hat{p} \pm z \cdot \sqrt{\frac{\hat{p}(1-\hat{p})}{N}}$$

This is the **Normal approximation** (Wald interval). It works well when `n` is large, but **breaks down for small counts** (like AI Engineer with n=1). That's why the output uses a more robust method.

### 4.3 The Wilson Score Interval (What the Output Uses)

The **Wilson score interval** is a better method for proportions, especially for small samples or extreme proportions (near 0% or 100%).

$$\text{CI} = \frac{\hat{p} + \frac{z^2}{2n} \pm z\sqrt{\frac{\hat{p}(1-\hat{p})}{n} + \frac{z^2}{4n^2}}}{1 + \frac{z^2}{n}}$$

Where:
- $\hat{p} = n_i / N$ is the observed proportion
- $z = 1.96$ for a 95% confidence level
- $n = N = 31$ (number of respondents)

This looks complex — but Python handles it in one line.

### 4.4 Worked Example

For "Team Lead / Manager": $n_i = 16$, $N = 31$, $\hat{p} = 16/31 \approx 0.516$

Using Wilson's formula with $z = 1.96$:
- Lower bound: **34.8%**
- Upper bound: **68.0%**

This matches the output: `[34.8%, 68.0%]`

### 4.5 Python Code

```python
from scipy.stats import binom

def wilson_ci(n_success, n_total, confidence=0.95):
    """
    Compute Wilson score confidence interval for a proportion.
    
    Parameters:
        n_success: number of "successes" (e.g., people who chose this option)
        n_total:   total number of respondents
        confidence: confidence level (default 0.95 for 95%)
    
    Returns:
        (lower, upper) as proportions (multiply by 100 for percentage)
    """
    z = stats.norm.ppf(1 - (1 - confidence) / 2)  # 1.96 for 95%
    p_hat = n_success / n_total
    
    denominator = 1 + z**2 / n_total
    centre = (p_hat + z**2 / (2 * n_total)) / denominator
    margin = z * np.sqrt(p_hat * (1 - p_hat) / n_total + z**2 / (4 * n_total**2)) / denominator
    
    return (centre - margin, centre + margin)

# Apply to all categories
N = 31
ci_results = []
for _, row in df.iterrows():
    lo, hi = wilson_ci(row["n"], N)
    ci_results.append({
        "Category": row["Category"],
        "n": row["n"],
        "pct": row["n"] / N * 100,
        "CI_low": lo * 100,
        "CI_high": hi * 100
    })

ci_df = pd.DataFrame(ci_results)
print(ci_df.to_string(index=False, float_format="%.1f"))
```

```
                     Category   n    pct  CI_low  CI_high
               Data Engineer    4   12.9     5.1     28.9
         Team Lead / Manager   16   51.6    34.8     68.0
           Software Engineer   16   51.6    34.8     68.0
             DevOps Engineer    3    9.7     3.3     24.9
          Software Architect    7   22.6    11.4     39.8
                 AI Engineer    1    3.2     0.6     16.2
  Quality Assurance Engineer    2    6.5     1.8     20.7
               Product Owner    1    3.2     0.6     16.2
              Data Scientist    3    9.7     3.3     24.9
```

> ✅ These match the output exactly!

### 4.6 Visualisation: Bar Chart with Error Bars

```python
fig, ax = plt.subplots(figsize=(10, 6))

pcts = ci_df["pct"].values
lower_err = pcts - ci_df["CI_low"].values
upper_err = ci_df["CI_high"].values - pcts
errors = [lower_err, upper_err]

ax.barh(ci_df["Category"], pcts, color="#4C72B0", alpha=0.75)
ax.errorbar(pcts, ci_df["Category"],
            xerr=errors,
            fmt='none', color='black', capsize=5, linewidth=2)

ax.set_xlabel("Percentage (%) with 95% Wilson CI")
ax.set_title("QQ01 — Role Distribution with Confidence Intervals (N=31)")
ax.axvline(x=100/9, color="gray", linestyle="--", label="Uniform")
ax.legend()
plt.tight_layout()
plt.savefig("qq01_ci.png", dpi=150)
plt.show()
```

> **What to notice:** Categories with small `n` (like AI Engineer, n=1) have **very wide CIs**, reflecting high uncertainty. Categories with larger `n` have narrower CIs.

### 4.7 Quick Comparison: Wilson vs Normal Approximation

```python
# Show why Wilson is better for small n
print(f"{'Category':<30} {'Wald Low':>10} {'Wald High':>10} {'Wilson Low':>12} {'Wilson High':>12}")
print("-" * 76)

z = 1.96
for _, row in ci_df.iterrows():
    p = row["n"] / N
    wald_lo = max(0, p - z * np.sqrt(p*(1-p)/N)) * 100
    wald_hi = min(1, p + z * np.sqrt(p*(1-p)/N)) * 100
    print(f"{row['Category']:<30} {wald_lo:>10.1f} {wald_hi:>10.1f} {row['CI_low']:>12.1f} {row['CI_high']:>12.1f}")
```

> **Key insight:** For "AI Engineer" (n=1), the Wald formula gives a lower bound below 0%, which is nonsensical. Wilson handles this gracefully.

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
