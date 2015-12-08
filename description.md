<div class ="row">
<div class="col">
### About
</div>

<div class="col-md-6 description">
#### Data
Here we show functional connectivity networks during an out-loud reading task. Electrocorticography (ECOG) signals were recorded while subjects read the words of a famous speech or nursery rhyme out loud as they scrolled across a computer screen.

Trials (*Speech*) were defined as the time period 500 ms before until 500 ms after the onset of speech, and they were compared to baseline data when the subject was not speaking (*Silence*).

Note that the subjects were not speaking before time 0 (speech onset) during the trials, although this time period likely includes neural activity related to reading and speech preparation. The trials were analyzed using a 200 ms sliding window.

#### Types of Networks
Five network types are available:

+  **Coherence difference**. $Coh(Speech) - Coh(Silence)$

+  **Weighted coherence**. $\hat{z}_{coh} = \frac{atanh(Coh(Speech)) - \frac{1}{2LP-2} - atanh(Coh(Silence) - \frac{1}{2KP-2}}{\sqrt{var_{jk}(\hat{z}_{coh})}}$

+  **Two-sided binary coherence**. Two-sided test for $H_0: \hat{z}_{coh}=0$, corrected for multiple comparisons using a false discovery rate criterion of 5%

+  **Weighted correlation**. $\hat{z}_{corr} = \frac{atanh(Corr(Speech)) - atanh(Corr(Silence))}{\sqrt{(var_{jk}(\hat{z}_{corr}))}}$

+  **Two-sided binary correlation**. Two-sided test for $H_0: \hat{z}_{corr}=0$, corrected for multiple comparisons using a false discovery rate criterion of 5%

where $Coh(.)$ is coherence between two edges at a particular time and frequency, $Corr(.)$ is correlation between two edges at a particular time, $atanh(.)$ is the Fisher transform, $var_{jk}(.)$ is the variance estimated using a two-sample jackknife-procedure, $L$ is the number of speech trials, $K$ is the number of silence intervals, and $P$ is the number of tapers used in the multitaper estimate of the coherence.

Under the null hypothesis of no coherence (or correlation) between the electrodes, $\hat{z}_{coh}$ ($\hat{z}_{corr}$) will be approximately distributed as a standard normal.

All frequency-domain statistics have a frequency resolution of +/- 5 Hz.

</div>

<div class="col-md-6 description">
#### Visualization
The selected network type is shown for a particular time and frequency, which can be chosen using the sliders on the right or by hovering over the spectrograms/coherograms/correlograms below.

Below the network view are shown several detail plots for a selected edge (a different edge can be selected by clicking the edge or by clicking on two nodes). In the middle, the edge statistic is shown for all time points (and for all frequencies if applicable). On the sides are shown the spectrograms on each incident node, plotted as the log of the ratio of the power during speech relative to silence.

#### Credits
The data were provided by [Dr. Gerwin Schalk](http://www.schalklab.org) and Dr. Peter Brunner at the Wadsworth Institute in Albany, New York.

Network analysis was performed by [Emily Stephen](http://www.emilystephen.com/) in the [Speech Lab at Boston University](http://www.bu.edu/speechlab/). Details of the analysis may be found in:

> Stephen, Emily Patricia. 2015. "Characterizing Dynamically Evolving Functional Networks in Humans with Application to Speech." Order No. 3733680, Boston University. [http://search.proquest.com/docview/1731940762?accountid=9676](http://search.proquest.com/docview/1731940762?accountid=9676).

The visualization was created by [Eric Denovellis](http://www.ericdeno.com/) under the advisement of [Daniel H. Bullock](http://cns.bu.edu/Profiles/Bullock.html) at Boston University.

Code for this visualization is free to use under the GPL-2.0 license. It is available on [Github](https://github.com/edeno/SpectraVis).

</div>
</div>
