---

## 7. Chi-Square Goodness of Fit: The Full Procedure

### 7.1 Intuition

Shannon entropy tells you **how spread out** a distribution is. The
chi-square goodness of fit test asks a sharper question: **is the pattern
you observe statistically real, or could it simply be random variation from
a small sample?**

With $n = 31$ respondents, a category showing 45 % might look dominant —
but is that dominant enough to be meaningful, or could it have happened by
chance even if the true population were uniform? Chi-square gives you a
principled answer.

---

### 7.2 The Full Procedure

#### Step 1 — State your null hypothesis

The null hypothesis ($H_0$) is your assumed baseline — the distribution
you would expect if nothing interesting were happening. In most survey
questions the natural baseline is the **uniform distribution**: all
categories are equally likely.

$H_0$: respondents are equally likely to choose any category.

The alternative ($H_1$) is simply the opposite: at least one category
is chosen more or less than expected.

You are not trying to prove $H_1$. You are testing whether the data gives
you enough evidence to **reject** $H_0$.

---

#### Step 2 — Compute expected counts

Suppose you ask 30 people: *What is your favourite drink — Tea, Coffee,
or Neither?*

Under $H_0$ (uniform), each category should receive $30 / 3 = 10$
responses.

| Category | Observed $O_i$ | Expected $E_i$ |
|---|--:|--:|
| Tea | 18 | 10 |
| Coffee | 8 | 10 |
| Neither | 4 | 10 |

---

#### Step 3 — Compute the chi-square statistic

$$\chi^2 = \sum \frac{(O_i - E_i)^2}{E_i}
= \frac{(18-10)^2}{10} + \frac{(8-10)^2}{10} + \frac{(4-10)^2}{10}
= 6.4 + 0.4 + 3.6 = 10.4$$

Each term measures how far one category deviates from expectation, scaled
by the expectation itself. Larger deviations contribute more to the total.
This number on its own means nothing yet — you need a reference to judge
whether 10.4 is large or small.

---

#### Step 4 — Degrees of freedom

$$df = k - 1 = 3 - 1 = 2$$

You lose one degree of freedom because the expected counts are constrained
to sum to $n$. Knowing two of the three expected values automatically fixes
the third.

---

#### Step 5 — The chi-square table

The chi-square distribution table gives you the **critical value** — the
threshold beyond which your result is considered statistically significant.
Rows are degrees of freedom, columns are significance levels ($\alpha$).

| df | $\alpha = 0.10$ | $\alpha = 0.05$ | $\alpha = 0.01$ |
|--:|--:|--:|--:|
| 1 | 2.706 | 3.841 | 6.635 |
| **2** | 4.605 | **5.991** | 9.210 |
| 3 | 6.251 | 7.815 | 11.345 |
| 4 | 7.779 | 9.488 | 13.277 |
| 5 | 9.236 | 11.070 | 15.086 |

For $df = 2$ and $\alpha = 0.05$, the critical value is **5.991**.

$\alpha$ is your tolerance for being wrong. $\alpha = 0.05$ means you
accept a 5 % chance of falsely rejecting $H_0$ when it is actually true.
This is the standard convention — you choose it **before** looking at the
data.

---

#### Step 6 — Make the decision and interpret

Your $\chi^2 = 10.4$ is greater than the critical value $5.991$, and the
p-value $= 0.006 < 0.05$.

You **reject $H_0$**. The distribution of drink preferences is
significantly different from uniform.

If $\chi^2$ had been below $5.991$, you would **fail to reject $H_0$** —
meaning you do not have enough evidence to claim a real pattern. This is
not the same as proving $H_0$ is true. Absence of evidence is not evidence
of absence.

**What does this actually mean for your data interpretation?**

Rejecting $H_0$ tells you the pattern is real — it is not a sampling
artefact. But the test alone does not tell you *where* the pattern comes
from. For that, look at the individual chi-square terms. Each term
$(O_i - E_i)^2 / E_i$ is a category-level contribution to the total.
Categories with large terms are the ones driving the result.

In the drink example:

| Category | Term | Interpretation |
|---|--:|---|
| Tea | 6.4 | Strongly over-represented |
| Coffee | 0.4 | Close to expected — not notable |
| Neither | 3.6 | Noticeably under-represented |

Tea is the dominant driver of the significant result. Coffee barely
deviates from expectation at all. This gives you a directional, nuanced
reading of the data: the significance is not spread evenly — it is
concentrated in specific categories.

In a survey context this translates directly to actionable interpretation.
A non-significant result ($\chi^2 < $ critical value) means respondents
are distributed roughly as you would expect by chance — there is no
dominant preference worth reporting. A significant result means the
distribution has real structure, and the individual terms tell you exactly
which categories are responsible.

This is what chi-square adds beyond proportions and entropy: **it separates
signal from noise**. Entropy tells you how diverse the distribution is;
proportions show you the shape; chi-square tells you whether that shape is
statistically trustworthy given your sample size.

---

#### The p-value — an alternative to the table

Instead of comparing to a critical value, you can compute the p-value
directly: the probability of getting a $\chi^2$ this large or larger purely
by chance, assuming $H_0$ is true.

For $\chi^2 = 10.4$, $df = 2$: $p = 0.006$.

Since $p < 0.05$, you reject $H_0$. The p-value and the critical value
table always lead to the same conclusion — they are two ways of expressing
the same thing.

---

### 7.3 The One Assumption to Always Check

The chi-square approximation only works reliably when all expected counts
$E_i \geq 5$. In this example $E_i = 10$ for all categories, so the
assumption holds cleanly. When some expected counts are very small — as
happens with rare categories in small survey samples — the test becomes
unreliable. In that case you should either merge related categories or use
an exact test.
